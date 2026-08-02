import { connectToDatabase } from '@/src/config/database';
import {
  analyseMessage,
  isMotorcycleProfileStatement,
  NluResult,
  ChatIntent,
} from '@/src/services/motorcycle-nlu.service';
import {
  retrieveProducts,
  RetrievedProduct,
} from '@/src/services/product-retrieval.service';
import {
  retrieveMaintenance,
  retrieveSymptoms,
  retrieveGlossary,
  categoriesFromKnowledge,
  requiresEscalation,
  KnowledgeItem,
} from '@/src/services/knowledge-retrieval.service';
import { buildReasons, summariseReasons, Reason } from '@/src/services/explanation.service';
import {
  buildGroundingPack,
  verifyAnswer,
  recordViolations,
  buildRepairPrompt,
  GroundedAnswer,
  GroundingPack,
  GROUNDED_ANSWER_SCHEMA,
  GROUNDED_SYSTEM_INSTRUCTION,
  VerificationFailure,
} from '@/src/services/grounding.service';
import { generateStructured, isGeminiConfigured, GeminiTurn } from '@/src/services/gemini.service';
import { getGeminiConfig } from '@/src/config/gemini';
import {
  loadContext,
  persistTurn,
  rememberMotorcycle,
  newTurnId,
} from '@/src/services/conversation.service';
import { ChatAnalyticsEvent } from '@/src/models/ChatAnalyticsEvent';
import { FITMENT_LABEL } from '@/src/services/compatibility.service';

/**
 * Chat orchestrator — the single entry point used by the /api/chat route.
 *
 * Retrieval-first pipeline. MongoDB is the source of truth; Gemini only phrases
 * facts that were already retrieved and is rejected when it strays:
 *
 *   load state (Mongo) → understand → clarify? → route by intent
 *     → retrieve knowledge (Mongo) → retrieve products (Mongo)
 *     → resolve fitment + build explanations (no LLM)
 *     → build grounding pack → generate JSON → VERIFY → persist
 *
 * Answer tiers:
 *   T2 — verified LLM answer
 *   T1 — deterministic template after verification failed twice
 *   T0 — deterministic template because Gemini is unavailable
 */

export interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface HandleChatInput {
  message: string;
  sessionId: string;
  userId?: string;
}

export interface ChatReason {
  code: string;
  label: string;
  text: string;
  tone: 'positive' | 'neutral' | 'caution';
}

export interface ChatProductCard {
  id: string;
  name: string;
  price: number;
  currency: string;
  brand: string;
  image: string | null;
  inStock: boolean;
  /** Retained for backward compatibility with the previous widget contract. */
  compatible?: boolean;
  fitment: string;
  fitmentLabel: string;
  ratingAvg: number;
  ratingCount: number;
  reasons: ChatReason[];
}

export interface ChatKnowledgeCard {
  ref: string;
  kind: string;
  title: string;
  source: string;
}

export interface HandleChatResult {
  reply: string;
  turnId: string;
  products: ChatProductCard[];
  knowledge: ChatKnowledgeCard[];
  meta: {
    intent: ChatIntent;
    confidence: number;
    motorcycle: string | null;
    motorcycleRemembered: boolean;
    categories: string[];
    aiGenerated: boolean;
    /** 0 = deterministic fallback, 1 = verified template, 2 = verified LLM. */
    answerTier: number;
    grounded: boolean;
    verificationFailures: number;
    needsClarification: boolean;
    escalated: boolean;
    latencyMs: number;
  };
}

/** Below this NLU confidence the assistant asks instead of guessing. */
const CONFIDENCE_THRESHOLD = 0.35;

function toHistoryTurns(history: ChatHistoryTurn[] = []): GeminiTurn[] {
  return history.map((t) => ({
    role: t.role === 'assistant' ? 'model' : 'user',
    text: t.content,
  }));
}

function priceLabel(p: { currency: string; price: number }): string {
  return `${p.currency === 'INR' ? 'Rs.' : '$'}${p.price}`;
}

function toProductCards(
  products: RetrievedProduct[],
  reasonsByProduct: Map<string, Reason[]>
): ChatProductCard[] {
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    currency: p.currency,
    brand: p.brand,
    image: p.image,
    inStock: p.inStock,
    compatible: p.fitment === 'FITS' || p.fitment === 'FITS_UNIVERSAL',
    fitment: p.fitment,
    fitmentLabel: FITMENT_LABEL[p.fitment],
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    reasons: (reasonsByProduct.get(p.id) || []).map((r) => ({
      code: r.code,
      label: r.label,
      text: r.text,
      tone: r.tone,
    })),
  }));
}

function toKnowledgeCards(items: KnowledgeItem[]): ChatKnowledgeCard[] {
  return items.map((k) => ({
    ref: k.ref,
    kind: k.kind,
    title: k.title,
    source: k.source?.title || 'GearGhar knowledge base',
  }));
}

/**
 * Deterministic reply built only from retrieved documents. This is Tier 0/1 —
 * used when Gemini is unavailable or its output failed verification. It is never
 * a dead end: it still surfaces real catalogue products and real knowledge.
 */
function deterministicReply(
  nlu: NluResult,
  products: RetrievedProduct[],
  knowledge: KnowledgeItem[],
  reasonsByProduct: Map<string, Reason[]>,
  escalate: boolean
): string {
  const bike = nlu.motorcycle ? nlu.motorcycle.label : 'your motorcycle';
  const sections: string[] = [];

  if (knowledge.length > 0) {
    const primary = knowledge[0];
    if (primary.kind === 'SymptomRule') {
      sections.push(`Here is what usually causes that on ${bike}:\n${primary.content}`);
    } else if (primary.kind === 'MaintenanceTask') {
      sections.push(`${primary.title} — ${primary.content}`);
    } else {
      sections.push(`${primary.title}: ${primary.content}`);
    }
    sections.push(`Source: ${primary.source?.title || 'GearGhar knowledge base'}.`);
  } else {
    const intro: Record<ChatIntent, string> = {
      product_recommendation: `Here are options from GearGhar that suit ${bike}:`,
      compatibility_check: nlu.motorcycle
        ? `Based on our fitment data for ${bike}:`
        : `Tell me your exact bike model and I can confirm fitment. In the meantime:`,
      comparison: `Here are the closest matching products so you can compare them:`,
      maintenance: `Here is what our service knowledge base holds for ${bike}:`,
      repair: `Here is what our diagnostic knowledge base holds for ${bike}:`,
      upgrade: `Popular upgrades for ${bike} from our catalogue:`,
      general: `Here is what I found on GearGhar that may help:`,
      motorcycle_profile: `Got it — I'll remember your motorcycle for future recommendations.`,
    };
    sections.push(intro[nlu.intent] || intro.general);
  }

  if (products.length > 0) {
    const lines = products.map((p) => {
      const why = summariseReasons(reasonsByProduct.get(p.id) || []);
      return `• ${p.name}${p.brand ? ` (${p.brand})` : ''} — ${priceLabel(p)}${why ? ` — ${why}` : ''}`;
    });
    sections.push(`\nMatching products:\n${lines.join('\n')}`);
  } else if (knowledge.length === 0) {
    sections.push(
      `\nI could not find a matching product right now. Try browsing the Shop page, or tell me the exact part and bike model.`
    );
  }

  if (escalate) {
    sections.push(
      `\nBecause this involves a safety-critical system, please have it checked by a qualified mechanic before riding.`
    );
  }

  return sections.join('\n');
}

/** Builds the one clarifying question the policy allows. */
function clarificationQuestion(nlu: NluResult): { slot: 'motorcycle' | 'category'; text: string } {
  if (!nlu.motorcycle) {
    return {
      slot: 'motorcycle',
      text: "Happy to help — which motorcycle do you ride? Tell me the brand and model (e.g. \"Yamaha R15 V4\") and I'll check fitment properly.",
    };
  }
  return {
    slot: 'category',
    text: `I want to get this right for your ${nlu.motorcycle.label}. Which part or area are you asking about — for example exhaust, brakes, chain, lighting or luggage?`,
  };
}

/**
 * Intent → knowledge retrieval plan. Product retrieval always follows, so a
 * diagnosis can drive part suggestions without the LLM choosing parts.
 */
async function retrieveKnowledge(
  nlu: NluResult,
  odometerKm?: number
): Promise<KnowledgeItem[]> {
  const message = nlu.keywords.join(' ');

  switch (nlu.intent) {
    case 'repair': {
      const symptoms = await retrieveSymptoms(nlu.motorcycle, nlu.rawText || message);
      if (symptoms.length > 0) return symptoms;
      return retrieveMaintenance(nlu.motorcycle, nlu.categories, message, odometerKm, 2);
    }
    case 'maintenance':
      return retrieveMaintenance(nlu.motorcycle, nlu.categories, message, odometerKm);
    case 'general':
    case 'product_recommendation':
    case 'upgrade':
      // Definition questions ("what is a tail tidy?") are answered from the glossary.
      if (nlu.isDefinitionQuery) {
        return retrieveGlossary(nlu.categories, nlu.rawText || message);
      }
      return nlu.categories.length > 0 ? retrieveGlossary(nlu.categories, '', 1) : [];
    case 'comparison':
      return nlu.categories.length > 0 ? retrieveGlossary(nlu.categories, '', 1) : [];
    default:
      return [];
  }
}

export async function handleChat(input: HandleChatInput): Promise<HandleChatResult> {
  const startedAt = Date.now();
  await connectToDatabase();

  const turnId = newTurnId();

  // ── L1: server-authoritative dialogue state ─────────────────────────────
  const ctx = await loadContext(input.sessionId, input.userId);

  // ── L2: understanding ───────────────────────────────────────────────────
  const nlu = await analyseMessage(input.message, ctx.priorUserMessages, ctx.rememberedSlug);

  const odometerKm = nlu.slots.odometerKm ?? ctx.odometerKm;

  // Profile statement ("I ride a Suzuki GN125") — acknowledge, remember, invite.
  if (isMotorcycleProfileStatement(nlu, input.message)) {
    await rememberMotorcycle(input.userId, nlu.motorcycle!, {
      year: nlu.slots.year,
      odometerKm: nlu.slots.odometerKm,
    });

    const saved = input.userId ? " I've saved it to your garage." : '';
    const reply =
      `Got it — I'll remember that you ride a ${nlu.motorcycle!.label}.${saved} ` +
      `What do you need: parts, upgrades, fitment advice, maintenance or a problem to diagnose?`;

    // The profile intent is decided by the orchestrator, not the keyword layer,
    // so stamp it before persisting or analytics would record it as 'general'.
    const profileNlu: NluResult = { ...nlu, intent: 'motorcycle_profile' };

    await finaliseTurn({
      input,
      turnId,
      nlu: profileNlu,
      reply,
      products: [],
      knowledge: [],
      aiGenerated: false,
      answerTier: 0,
      verificationFailures: 0,
      startedAt,
      beginnerMode: ctx.beginnerMode,
    });

    return {
      reply,
      turnId,
      products: [],
      knowledge: [],
      meta: {
        intent: 'motorcycle_profile',
        confidence: 1,
        motorcycle: nlu.motorcycle!.label,
        motorcycleRemembered: nlu.motorcycleFromMemory,
        categories: nlu.categories,
        aiGenerated: false,
        answerTier: 0,
        grounded: true,
        verificationFailures: 0,
        needsClarification: false,
        escalated: false,
        latencyMs: Date.now() - startedAt,
      },
    };
  }

  // ── Clarification policy: ask once rather than guess ────────────────────
  const noEvidence = nlu.categories.length === 0 && !nlu.motorcycle;
  const lowConfidence = nlu.confidence < CONFIDENCE_THRESHOLD;
  const alreadyAsked = ctx.conversation.sessionState?.pendingSlot;

  if (!nlu.isDefinitionQuery && lowConfidence && noEvidence && !alreadyAsked) {
    const question = clarificationQuestion(nlu);

    await finaliseTurn({
      input,
      turnId,
      nlu,
      reply: question.text,
      products: [],
      knowledge: [],
      aiGenerated: false,
      answerTier: 0,
      verificationFailures: 0,
      startedAt,
      pendingSlot: question.slot,
      beginnerMode: ctx.beginnerMode,
    });

    return {
      reply: question.text,
      turnId,
      products: [],
      knowledge: [],
      meta: {
        intent: nlu.intent,
        confidence: nlu.confidence,
        motorcycle: nlu.motorcycle?.label ?? null,
        motorcycleRemembered: nlu.motorcycleFromMemory,
        categories: nlu.categories,
        aiGenerated: false,
        answerTier: 0,
        grounded: true,
        verificationFailures: 0,
        needsClarification: true,
        escalated: false,
        latencyMs: Date.now() - startedAt,
      },
    };
  }

  // ── L3/L4: retrieval — knowledge first, then products ───────────────────
  const knowledge = await retrieveKnowledge(nlu, odometerKm);
  const knowledgeCategories = categoriesFromKnowledge(knowledge);
  const escalate = requiresEscalation(knowledge);

  const products = await retrieveProducts(nlu, {
    limit: nlu.intent === 'comparison' ? 3 : 4,
    budget: nlu.slots.budget ?? ctx.conversation.sessionState?.resolvedBudget,
    purchasedProductIds: ctx.purchasedProductIds,
    extraCategories: knowledgeCategories,
  });

  // ── L5/L6: explanations (deterministic) ─────────────────────────────────
  const reasonsByProduct = new Map<string, Reason[]>();
  for (const p of products) {
    reasonsByProduct.set(
      p.id,
      buildReasons(p, {
        motorcycle: nlu.motorcycle,
        budget: nlu.slots.budget,
        knowledgeCategories,
        intent: nlu.intent,
      })
    );
  }

  // ── L7/L8: grounded generation + verification ───────────────────────────
  const pack = buildGroundingPack(
    input.message,
    nlu,
    products,
    reasonsByProduct,
    knowledge,
    escalate,
    odometerKm
  );

  const generated = await generateGrounded({
    pack,
    history: toHistoryTurns(ctx.historyTurns),
    sessionId: input.sessionId,
    turnId,
    userId: input.userId,
  });

  let reply: string;
  let aiGenerated = false;
  let answerTier = 0;

  if (generated.ok && generated.answer) {
    reply = generated.answer;
    aiGenerated = true;
    answerTier = 2;
  } else {
    reply = deterministicReply(nlu, products, knowledge, reasonsByProduct, escalate);
    // Tier 1 = Gemini was available but its output could not be verified.
    answerTier = generated.attempted ? 1 : 0;
  }

  await finaliseTurn({
    input,
    turnId,
    nlu,
    reply,
    products,
    knowledge,
    aiGenerated,
    answerTier,
    verificationFailures: generated.failureCount,
    startedAt,
    budget: nlu.slots.budget,
    beginnerMode: ctx.beginnerMode,
  });

  return {
    reply,
    turnId,
    products: toProductCards(products, reasonsByProduct),
    knowledge: toKnowledgeCards(knowledge),
    meta: {
      intent: nlu.intent,
      confidence: nlu.confidence,
      motorcycle: nlu.motorcycle ? nlu.motorcycle.label : null,
      motorcycleRemembered: nlu.motorcycleFromMemory,
      categories: nlu.categories,
      aiGenerated,
      answerTier,
      grounded: true,
      verificationFailures: generated.failureCount,
      needsClarification: false,
      escalated: escalate,
      latencyMs: Date.now() - startedAt,
    },
  };
}

interface GenerationOutcome {
  ok: boolean;
  answer?: string;
  /** True when Gemini was configured and actually called. */
  attempted: boolean;
  failureCount: number;
}

/**
 * Calls Gemini with the grounding pack, verifies the result, and allows exactly
 * one repair attempt before giving up in favour of the deterministic reply.
 */
async function generateGrounded(params: {
  pack: GroundingPack;
  history: GeminiTurn[];
  sessionId: string;
  turnId: string;
  userId?: string;
}): Promise<GenerationOutcome> {
  if (!isGeminiConfigured()) {
    return { ok: false, attempted: false, failureCount: 0 };
  }

  const model = getGeminiConfig().model;
  const basePrompt = `CONTEXT:\n${JSON.stringify(params.pack, null, 2)}\n\nAnswer the user's message using ONLY the facts above.`;
  let totalFailures = 0;
  let repairPrompt = '';

  for (let attempt = 1; attempt <= 2; attempt++) {
    let candidate: GroundedAnswer;
    try {
      candidate = await generateStructured<GroundedAnswer>({
        systemInstruction: GROUNDED_SYSTEM_INSTRUCTION,
        history: params.history,
        prompt: repairPrompt ? `${basePrompt}\n\n${repairPrompt}` : basePrompt,
        responseSchema: GROUNDED_ANSWER_SCHEMA as unknown as Record<string, any>,
        maxOutputTokens: 900,
      });
    } catch (err) {
      console.error(`[grounding] generation attempt ${attempt} failed:`, err);
      const failure: VerificationFailure = {
        type: 'schema_invalid',
        offendingSpan: '',
        detail: String((err as Error)?.message || err).slice(0, 400),
      };
      totalFailures++;
      await recordViolations({
        sessionId: params.sessionId,
        turnId: params.turnId,
        userId: params.userId,
        failures: [failure],
        pack: params.pack,
        model,
        attempt,
        resolvedBy: attempt === 1 ? 'retry' : 'fallback',
      });
      continue;
    }

    const verdict = verifyAnswer(candidate, params.pack);

    if (verdict.ok) {
      return { ok: true, answer: verdict.answer, attempted: true, failureCount: totalFailures };
    }

    totalFailures += verdict.failures.length;
    await recordViolations({
      sessionId: params.sessionId,
      turnId: params.turnId,
      userId: params.userId,
      failures: verdict.failures,
      pack: params.pack,
      model,
      attempt,
      resolvedBy: attempt === 1 ? 'retry' : 'fallback',
    });

    repairPrompt = buildRepairPrompt(verdict.failures);
  }

  return { ok: false, attempted: true, failureCount: totalFailures };
}

/** Persists the transcript, dialogue state and the analytics event. */
async function finaliseTurn(params: {
  input: HandleChatInput;
  turnId: string;
  nlu: NluResult;
  reply: string;
  products: RetrievedProduct[];
  knowledge: KnowledgeItem[];
  aiGenerated: boolean;
  answerTier: number;
  verificationFailures: number;
  startedAt: number;
  pendingSlot?: 'motorcycle' | 'category' | 'budget' | 'symptom' | null;
  budget?: number;
  beginnerMode?: boolean;
}): Promise<void> {
  const latencyMs = Date.now() - params.startedAt;
  const productIds = params.products.map((p) => p.id);
  const knowledgeRefs = params.knowledge.map((k) => k.ref);

  try {
    await persistTurn({
      sessionId: params.input.sessionId,
      userId: params.input.userId,
      turnId: params.turnId,
      userMessage: params.input.message,
      assistantMessage: params.reply,
      intent: params.nlu.intent,
      motorcycleSlug: params.nlu.motorcycle?.slug,
      motorcycleId: params.nlu.motorcycle?.id,
      categories: params.nlu.categories,
      recommendedProductIds: productIds,
      knowledgeRefs,
      aiGenerated: params.aiGenerated,
      answerTier: params.answerTier,
      nluConfidence: params.nlu.confidence,
      latencyMs,
      pendingSlot: params.pendingSlot ?? null,
      pendingIntent: params.pendingSlot ? params.nlu.intent : undefined,
      budget: params.budget,
      beginnerMode: params.beginnerMode,
    });
  } catch (err) {
    console.error('Failed to persist chat turn:', err);
  }

  try {
    await ChatAnalyticsEvent.create({
      sessionId: params.input.sessionId,
      user: params.input.userId,
      turnId: params.turnId,
      intent: params.nlu.intent,
      motorcycleSlug: params.nlu.motorcycle?.slug,
      motorcycleLabel: params.nlu.motorcycle?.label,
      categories: params.nlu.categories,
      recommendedProducts: productIds,
      knowledgeRefs,
      aiGenerated: params.aiGenerated,
      answerTier: params.answerTier,
      nluConfidence: params.nlu.confidence,
      verificationFailures: params.verificationFailures,
      latencyMs,
    });
  } catch (err) {
    console.error('Failed to record chat analytics:', err);
  }
}
