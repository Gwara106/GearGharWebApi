import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { ChatConversation, IChatConversation, IChatMessage } from '@/src/models/ChatConversation';
import { User } from '@/src/models/User';
import { DetectedMotorcycle } from '@/src/services/motorcycle-nlu.service';

/**
 * Conversation memory.
 *
 * History is now read from MongoDB rather than trusted from the request body.
 * That change does three things at once:
 *   1. Memory survives page reloads, cleared localStorage and device switches.
 *   2. A logged-in rider's motorcycle is remembered permanently via User.garage.
 *   3. The browser can no longer forge prior turns into the model's context,
 *      which closed a prompt-injection path.
 */

export interface LoadedContext {
  conversation: IChatConversation;
  /** Prior user messages, newest first — feeds the NLU memory lookup. */
  priorUserMessages: string[];
  /** Recent turns for the LLM, oldest first. */
  historyTurns: Array<{ role: 'user' | 'assistant'; content: string }>;
  rememberedSlug?: string;
  odometerKm?: number;
  beginnerMode: boolean;
  purchasedProductIds: string[];
}

const HISTORY_TURNS = 6; // last 3 exchanges
const MEMORY_LOOKBACK = 12;

export function newTurnId(): string {
  return randomUUID();
}

/**
 * Loads (or creates) the conversation and assembles everything the orchestrator
 * needs. The user's primary garage bike takes precedence over transcript memory
 * only when the transcript has no bike at all — an explicitly named bike in the
 * current message always wins (resolved later in the NLU).
 */
export async function loadContext(sessionId: string, userId?: string): Promise<LoadedContext> {
  let conversation = (await ChatConversation.findOne({ sessionId })) as IChatConversation | null;

  if (!conversation) {
    conversation = (await ChatConversation.create({
      sessionId,
      user: userId,
      messages: [],
      sessionState: { lastShownProducts: [], lastCategories: [], beginnerMode: false, turnCount: 0 },
    })) as IChatConversation;
  } else if (userId && !conversation.user) {
    // Guest session that has since logged in — bind it.
    conversation.user = new mongoose.Types.ObjectId(userId);
    await conversation.save();
  }

  const messages = conversation.messages || [];
  const priorUserMessages = messages
    .filter((m) => m.role === 'user')
    .slice(-MEMORY_LOOKBACK)
    .map((m) => m.content)
    .reverse();

  const historyTurns = messages.slice(-HISTORY_TURNS).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let rememberedSlug = conversation.sessionState?.activeMotorcycleSlug;
  let odometerKm: number | undefined;
  let beginnerMode = conversation.sessionState?.beginnerMode ?? false;
  let purchasedProductIds: string[] = [];

  if (userId) {
    const user: any = await User.findById(userId).select('garage preferences').lean();
    const primary =
      user?.garage?.find((g: any) => g.isPrimary) || user?.garage?.[0] || null;
    if (primary) {
      rememberedSlug = rememberedSlug || primary.motorcycleSlug;
      odometerKm = primary.odometerKm;
    }
    if (user?.preferences?.beginnerMode) beginnerMode = true;
    purchasedProductIds = await loadPurchasedProductIds(userId);
  }

  return {
    conversation,
    priorUserMessages,
    historyTurns,
    rememberedSlug,
    odometerKm,
    beginnerMode,
    purchasedProductIds,
  };
}

/** Product ids the user has already bought — used to demote repeat suggestions. */
async function loadPurchasedProductIds(userId: string): Promise<string[]> {
  try {
    const { Order } = await import('@/src/models/Order');
    const orders: any[] = await Order.find({ user: userId })
      .select('items')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const ids = new Set<string>();
    for (const order of orders) {
      // OrderItem stores the product reference as `item` (see src/models/Order.ts).
      for (const line of order.items || []) {
        if (line?.item) ids.add(String(line.item));
      }
    }
    return Array.from(ids);
  } catch {
    return [];
  }
}

/**
 * Persists the rider's motorcycle to their permanent garage. Idempotent: an
 * existing entry is updated (and promoted to primary) rather than duplicated.
 */
export async function rememberMotorcycle(
  userId: string | undefined,
  bike: DetectedMotorcycle,
  extras: { year?: number; odometerKm?: number } = {}
): Promise<void> {
  if (!userId) return;

  try {
    const user: any = await User.findById(userId).select('garage');
    if (!user) return;

    const existing = (user.garage || []).find((g: any) => g.motorcycleSlug === bike.slug);

    if (existing) {
      if (extras.year) existing.year = extras.year;
      if (extras.odometerKm) {
        existing.odometerKm = extras.odometerKm;
        existing.odometerUpdatedAt = new Date();
      }
      for (const g of user.garage) g.isPrimary = false;
      existing.isPrimary = true;
    } else {
      for (const g of user.garage || []) g.isPrimary = false;
      user.garage = [
        ...(user.garage || []),
        {
          motorcycle: new mongoose.Types.ObjectId(bike.id),
          motorcycleSlug: bike.slug,
          motorcycleLabel: bike.label,
          year: extras.year,
          odometerKm: extras.odometerKm,
          odometerUpdatedAt: extras.odometerKm ? new Date() : undefined,
          isPrimary: true,
          addedAt: new Date(),
        },
      ];
    }

    await user.save();
  } catch (err) {
    console.error('Failed to update user garage:', err);
  }
}

export interface PersistTurnInput {
  sessionId: string;
  userId?: string;
  turnId: string;
  userMessage: string;
  assistantMessage: string;
  intent: string;
  motorcycleSlug?: string;
  motorcycleId?: string;
  categories: string[];
  recommendedProductIds: string[];
  knowledgeRefs: string[];
  aiGenerated: boolean;
  answerTier: number;
  nluConfidence: number;
  latencyMs: number;
  pendingSlot?: 'motorcycle' | 'category' | 'budget' | 'symptom' | null;
  pendingIntent?: string;
  budget?: number;
  beginnerMode?: boolean;
}

/** Appends both turns and advances the server-side dialogue state atomically. */
export async function persistTurn(input: PersistTurnInput): Promise<void> {
  const now = new Date();

  const userTurn: Partial<IChatMessage> = {
    role: 'user',
    content: input.userMessage,
    turnId: input.turnId,
    createdAt: now,
  };

  const assistantTurn: Partial<IChatMessage> = {
    role: 'assistant',
    content: input.assistantMessage,
    turnId: input.turnId,
    intent: input.intent,
    motorcycleSlug: input.motorcycleSlug,
    categories: input.categories,
    recommendedProducts: input.recommendedProductIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id)),
    knowledgeRefs: input.knowledgeRefs,
    aiGenerated: input.aiGenerated,
    answerTier: input.answerTier,
    nluConfidence: input.nluConfidence,
    latencyMs: input.latencyMs,
    createdAt: now,
  };

  const state: Record<string, any> = {
    'sessionState.pendingSlot': input.pendingSlot ?? null,
    'sessionState.pendingIntent': input.pendingIntent,
    'sessionState.lastCategories': input.categories,
    'sessionState.lastShownProducts': input.recommendedProductIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id)),
    'sessionState.updatedAt': now,
  };
  if (input.motorcycleSlug) state['sessionState.activeMotorcycleSlug'] = input.motorcycleSlug;
  if (input.motorcycleId && mongoose.Types.ObjectId.isValid(input.motorcycleId)) {
    state['sessionState.activeMotorcycle'] = new mongoose.Types.ObjectId(input.motorcycleId);
  }
  if (input.budget) state['sessionState.resolvedBudget'] = input.budget;
  if (typeof input.beginnerMode === 'boolean') {
    state['sessionState.beginnerMode'] = input.beginnerMode;
  }

  await ChatConversation.updateOne(
    { sessionId: input.sessionId },
    {
      $setOnInsert: { sessionId: input.sessionId },
      $set: { ...state, ...(input.userId ? { user: input.userId } : {}) },
      $push: { messages: { $each: [userTurn, assistantTurn] } },
      $inc: { 'sessionState.turnCount': 1 },
    },
    { upsert: true }
  );
}

/** Looks up the stored metadata for a turn — used by the feedback endpoint. */
export async function findTurn(
  turnId: string
): Promise<{ sessionId: string; message: IChatMessage } | null> {
  const convo: any = await ChatConversation.findOne(
    { 'messages.turnId': turnId },
    { sessionId: 1, messages: 1 }
  ).lean();
  if (!convo) return null;
  const message = (convo.messages || []).find(
    (m: IChatMessage) => m.turnId === turnId && m.role === 'assistant'
  );
  return message ? { sessionId: convo.sessionId, message } : null;
}
