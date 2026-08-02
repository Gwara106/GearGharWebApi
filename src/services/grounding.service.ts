import { RetrievedProduct } from '@/src/services/product-retrieval.service';
import { KnowledgeItem } from '@/src/services/knowledge-retrieval.service';
import { Reason } from '@/src/services/explanation.service';
import { NluResult } from '@/src/services/motorcycle-nlu.service';
import { GroundingViolation, ViolationType } from '@/src/models/GroundingViolation';

/**
 * Grounding & verification layer — the enforcement point for the project's
 * central invariant:
 *
 *   INV-G: every entity-level factual assertion in a delivered reply must be
 *          traceable to a MongoDB document retrieved for that turn.
 *
 * The system prompt already ASKS the model not to invent products. A prompt is
 * a request, not a control. This module makes it a control: the model's output
 * is parsed, checked against the exact document set we supplied, and suppressed
 * if it fails. Every failure is written to GroundingViolation, which turns the
 * anti-hallucination claim into a measurable rate rather than an assertion.
 */

export interface GroundingPack {
  userMessage: string;
  resolved: {
    intent: string;
    confidence: number;
    motorcycle: { label: string; type: string; engineCc?: number } | null;
    motorcycleRemembered: boolean;
    categories: string[];
    budget?: number;
    odometerKm?: number;
  };
  products: Array<{
    id: string;
    name: string;
    brand: string;
    price: number;
    currency: string;
    inStock: boolean;
    fitment: string;
    reasons: string[];
  }>;
  knowledge: Array<{
    ref: string;
    kind: string;
    title: string;
    content: string;
    source: string;
  }>;
  constraints: {
    citeEveryClaim: true;
    noNewEntities: true;
    requiresEscalation: boolean;
    maxWords: number;
  };
}

/** The JSON contract Gemini must satisfy. Enforced server-side by verifyAnswer. */
export const GROUNDED_ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    citedProductIds: { type: 'array', items: { type: 'string' } },
    citedKnowledgeRefs: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number' },
    needsClarification: { type: 'boolean' },
  },
  required: ['answer', 'citedProductIds', 'citedKnowledgeRefs'],
} as const;

export interface GroundedAnswer {
  answer: string;
  citedProductIds: string[];
  citedKnowledgeRefs: string[];
  confidence?: number;
  needsClarification?: boolean;
}

export const GROUNDED_SYSTEM_INSTRUCTION = `You are GearGhar Assistant, an expert motorcycle mechanic and parts advisor for GearGhar.

You are a WRITER, not a source of facts. Every factual statement you make must come from the CONTEXT object supplied in the user turn.

Hard rules:
- Recommend ONLY products present in context.products. Refer to them by their exact name.
- NEVER state a price, stock level, brand or fitment claim that is not in the context.
- NEVER invent product names, part numbers, service intervals or specifications.
- Use context.knowledge for maintenance, diagnosis and part explanations. Do not add steps of your own.
- If context.products is empty, do not name any product; explain what to look for instead.
- If a product's fitment is "UNKNOWN", say the fitment is unverified. If it is "FITS", you may say it fits.
- When context.constraints.requiresEscalation is true you MUST advise consulting a qualified mechanic.
- Be concise, friendly and practical. Short paragraphs or bullet points. Under 150 words unless asked for detail.
- Write for a beginner rider: expand jargon in plain language.

Return JSON only, matching this shape:
{ "answer": string, "citedProductIds": string[], "citedKnowledgeRefs": string[], "confidence": number, "needsClarification": boolean }

citedProductIds must contain the exact id strings of every product you named.
citedKnowledgeRefs must contain the exact ref strings of every knowledge item you used.`;

export function buildGroundingPack(
  message: string,
  nlu: NluResult,
  products: RetrievedProduct[],
  reasonsByProduct: Map<string, Reason[]>,
  knowledge: KnowledgeItem[],
  requiresEscalation: boolean,
  odometerKm?: number
): GroundingPack {
  return {
    userMessage: message,
    resolved: {
      intent: nlu.intent,
      confidence: nlu.confidence,
      motorcycle: nlu.motorcycle
        ? {
            label: nlu.motorcycle.label,
            type: nlu.motorcycle.type,
            engineCc: nlu.motorcycle.engineCc,
          }
        : null,
      motorcycleRemembered: nlu.motorcycleFromMemory,
      categories: nlu.categories,
      budget: nlu.slots?.budget,
      odometerKm,
    },
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      currency: p.currency,
      inStock: p.inStock,
      fitment: p.fitment,
      reasons: (reasonsByProduct.get(p.id) || []).map((r) => r.text),
    })),
    knowledge: knowledge.map((k) => ({
      ref: k.ref,
      kind: k.kind,
      title: k.title,
      content: k.content,
      source: k.source?.title || 'GearGhar knowledge base',
    })),
    constraints: {
      citeEveryClaim: true,
      noNewEntities: true,
      requiresEscalation,
      maxWords: 150,
    },
  };
}

export interface VerificationFailure {
  type: ViolationType;
  offendingSpan: string;
  detail: string;
}

export interface VerificationResult {
  ok: boolean;
  failures: VerificationFailure[];
  /** The answer text, with a server-injected escalation clause when required. */
  answer: string;
}

const ESCALATION_CLAUSE =
  'Because this involves a safety-critical system, please have it checked by a qualified mechanic before riding.';

const ESCALATION_MARKERS = ['mechanic', 'workshop', 'professional', 'qualified technician'];

/** Words that look like an entity but are safe generic vocabulary. */
const ENTITY_STOPWORDS = new Set([
  'gearghar', 'i', 'the', 'a', 'an', 'you', 'your', 'it', 'we', 'our', 'if', 'for', 'and', 'but',
  'this', 'that', 'these', 'those', 'check', 'note', 'tip', 'tips', 'warning', 'steps', 'step',
  'here', 'what', 'when', 'why', 'how', 'because', 'also', 'please', 'always', 'never', 'most',
  'some', 'both', 'best', 'good', 'first', 'next', 'then', 'finally', 'in', 'on', 'at', 'to',
  'my', 'me', 'they', 'them', 'its', 'as', 'so', 'or', 'is', 'are', 'be', 'do', 'does',
]);

/**
 * Verifies a generated answer against the exact facts supplied for this turn.
 *
 * Checks:
 *  1. Non-empty answer.
 *  2. Every cited product id exists in the pack.
 *  3. Every cited knowledge ref exists in the pack.
 *  4. Every price-shaped number in the prose matches a supplied price.
 *  5. Every capitalised multi-word entity in the prose is a supplied product,
 *     brand or knowledge title (catches invented product names).
 *  6. Escalation clause present when the knowledge base demands it (auto-repaired
 *     rather than rejected — a safety clause is always safe to add).
 */
export function verifyAnswer(answer: GroundedAnswer, pack: GroundingPack): VerificationResult {
  const failures: VerificationFailure[] = [];
  let text = (answer?.answer || '').trim();

  if (!text) {
    return {
      ok: false,
      answer: '',
      failures: [{ type: 'empty_answer', offendingSpan: '', detail: 'Model returned no answer text' }],
    };
  }

  const productIds = new Set(pack.products.map((p) => p.id));
  const knowledgeRefs = new Set(pack.knowledge.map((k) => k.ref));

  // 2. Product citations.
  for (const id of answer.citedProductIds || []) {
    if (!productIds.has(id)) {
      failures.push({
        type: 'unknown_product_id',
        offendingSpan: id,
        detail: `Cited product id was not in the retrieved candidate set (${productIds.size} candidates)`,
      });
    }
  }

  // 3. Knowledge citations.
  for (const ref of answer.citedKnowledgeRefs || []) {
    if (!knowledgeRefs.has(ref)) {
      failures.push({
        type: 'unknown_knowledge_id',
        offendingSpan: ref,
        detail: 'Cited knowledge ref was not supplied for this turn',
      });
    }
  }

  // 4. Price fidelity.
  const allowedPrices = new Set<string>();
  for (const p of pack.products) {
    allowedPrices.add(String(p.price));
    allowedPrices.add(String(Math.round(p.price)));
    allowedPrices.add(p.price.toLocaleString('en-IN'));
    allowedPrices.add(p.price.toLocaleString('en-US'));
  }
  // Use the captured amount, not the whole match — stripping non-digits from
  // "Rs.8499" would otherwise leave ".8499" and flag every valid price.
  const pricePattern = /(?:rs\.?|₹|inr|\$)\s?([\d,]+(?:\.\d{1,2})?)/gi;
  let priceMatch: RegExpExecArray | null;
  while ((priceMatch = pricePattern.exec(text)) !== null) {
    const numeric = priceMatch[1].trim();
    const bare = numeric.replace(/,/g, '');
    if (!allowedPrices.has(numeric) && !allowedPrices.has(bare)) {
      failures.push({
        type: 'price_mismatch',
        offendingSpan: priceMatch[0],
        detail: `Price not present in the retrieved product set [${Array.from(allowedPrices).slice(0, 8).join(', ')}]`,
      });
    }
  }

  // 5. Invented-entity detection.
  const allowedTerms = new Set<string>();
  const addTerms = (s: string) => {
    for (const w of s.toLowerCase().split(/[^a-z0-9+]+/)) {
      if (w.length > 1) allowedTerms.add(w);
    }
  };
  for (const p of pack.products) {
    addTerms(p.name);
    addTerms(p.brand);
  }
  for (const k of pack.knowledge) {
    addTerms(k.title);
    addTerms(k.content);
  }
  if (pack.resolved.motorcycle) addTerms(pack.resolved.motorcycle.label);
  for (const c of pack.resolved.categories) addTerms(c.replace(/_/g, ' '));
  addTerms(pack.userMessage);

  /**
   * A word is known when every sub-token is known, so hyphenated and
   * slash-joined forms ("Slip-On") resolve against the tokens extracted from
   * the source documents ("slip", "on").
   */
  const isKnownWord = (word: string): boolean => {
    const parts = word.toLowerCase().split(/[^a-z0-9+]+/).filter((p) => p.length > 1);
    if (parts.length === 0) return true;
    return parts.every((p) => allowedTerms.has(p));
  };

  // Multi-word Capitalised Sequences read as brand/product names.
  const entityPattern = /\b([A-Z][a-zA-Z0-9+-]{1,}(?:\s+[A-Z0-9][a-zA-Z0-9+-]{1,}){1,4})\b/g;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = entityPattern.exec(text)) !== null) {
    const phrase = m[1];
    if (seen.has(phrase)) continue;
    seen.add(phrase);

    const words = phrase.split(/\s+/).filter((w) => !ENTITY_STOPWORDS.has(w.toLowerCase()));
    if (words.length < 2) continue;

    const unknown = words.filter((w) => !isKnownWord(w));
    // Two or more unsupported tokens in one capitalised phrase is an invented
    // product or brand name; a single stray token is ordinary English.
    //
    // When NO products were retrieved the bar drops to one: there is nothing in
    // the catalogue to name, so any unsupported proper noun is an invention.
    // This is the case that matters most — an empty candidate set is exactly
    // when a model is most tempted to supply a plausible product from memory.
    const threshold = pack.products.length === 0 ? 1 : 2;
    if (unknown.length >= threshold || (unknown.length > 0 && unknown.length === words.length)) {
      failures.push({
        type: 'unlisted_entity',
        offendingSpan: phrase,
        detail: `Capitalised entity contains ${unknown.length} token(s) absent from every retrieved document: ${unknown.join(', ')}`,
      });
    }
  }

  // 6. Safety escalation — repaired, not rejected.
  if (pack.constraints.requiresEscalation) {
    const lower = text.toLowerCase();
    if (!ESCALATION_MARKERS.some((mk) => lower.includes(mk))) {
      text = `${text}\n\n${ESCALATION_CLAUSE}`;
    }
  }

  return { ok: failures.length === 0, failures, answer: text };
}

/** Persists verification failures. Best-effort: never blocks the user reply. */
export async function recordViolations(params: {
  sessionId: string;
  turnId: string;
  userId?: string;
  failures: VerificationFailure[];
  pack: GroundingPack;
  model: string;
  attempt: number;
  resolvedBy: 'retry' | 'fallback' | 'unresolved';
}): Promise<void> {
  if (params.failures.length === 0) return;
  try {
    await GroundingViolation.insertMany(
      params.failures.map((f) => ({
        sessionId: params.sessionId,
        turnId: params.turnId,
        user: params.userId,
        violationType: f.type,
        offendingSpan: f.offendingSpan.slice(0, 500),
        detail: f.detail.slice(0, 500),
        candidateProductIds: params.pack.products.map((p) => p.id),
        candidateKnowledgeIds: params.pack.knowledge.map((k) => k.ref),
        model: params.model,
        attempt: params.attempt,
        resolvedBy: params.resolvedBy,
      })),
      { ordered: false }
    );
  } catch (err) {
    console.error('Failed to record grounding violations:', err);
  }
}

/** Repair prompt appended on the single retry allowed before falling back. */
export function buildRepairPrompt(failures: VerificationFailure[]): string {
  const lines = failures.map((f) => `- ${f.type}: "${f.offendingSpan}" — ${f.detail}`);
  return `Your previous answer failed verification:\n${lines.join('\n')}\n\nRewrite the answer using ONLY the facts in the CONTEXT object. Remove every unsupported name, price and claim. Return the same JSON shape.`;
}
