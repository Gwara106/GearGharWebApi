import mongoose, { Schema, Document } from 'mongoose';

/**
 * Full transcript of an assistant session. Stores per-message metadata (detected
 * intent, motorcycle, categories, recommended products) so conversations can be
 * replayed and analysed for the thesis.
 */
export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Stable id joining this turn to ChatFeedback and GroundingViolation. */
  turnId?: string;
  intent?: string;
  motorcycleSlug?: string;
  categories?: string[];
  recommendedProducts?: mongoose.Types.ObjectId[];
  /** True when the reply came from Gemini, false when from the rule-based fallback. */
  aiGenerated?: boolean;
  /** 0 = deterministic fallback, 1 = verified template, 2 = verified LLM answer. */
  answerTier?: number;
  /** Knowledge documents cited by this turn (e.g. "MaintenanceTask:chain-lube"). */
  knowledgeRefs?: string[];
  nluConfidence?: number;
  latencyMs?: number;
  createdAt: Date;
}

/**
 * Server-authoritative dialogue state. Replaces the client-supplied `history`
 * array: memory now lives in MongoDB, survives reloads and device changes, and
 * cannot be forged by the browser.
 */
export interface IChatSessionState {
  activeMotorcycle?: mongoose.Types.ObjectId;
  activeMotorcycleSlug?: string;
  /** Slot the assistant asked about and is waiting to have filled. */
  pendingSlot?: 'motorcycle' | 'category' | 'budget' | 'symptom' | null;
  pendingIntent?: string;
  lastShownProducts: mongoose.Types.ObjectId[];
  lastCategories: string[];
  resolvedBudget?: number;
  beginnerMode: boolean;
  turnCount: number;
  updatedAt?: Date;
}

export interface IChatConversation extends Document {
  sessionId: string;
  user?: mongoose.Types.ObjectId;
  messages: IChatMessage[];
  sessionState: IChatSessionState;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    turnId: { type: String },
    intent: { type: String },
    motorcycleSlug: { type: String },
    categories: { type: [String], default: undefined },
    recommendedProducts: { type: [Schema.Types.ObjectId], ref: 'Product', default: undefined },
    aiGenerated: { type: Boolean },
    answerTier: { type: Number },
    knowledgeRefs: { type: [String], default: undefined },
    nluConfidence: { type: Number },
    latencyMs: { type: Number },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatSessionStateSchema = new Schema<IChatSessionState>(
  {
    activeMotorcycle: { type: Schema.Types.ObjectId, ref: 'Motorcycle' },
    activeMotorcycleSlug: { type: String },
    pendingSlot: {
      type: String,
      enum: ['motorcycle', 'category', 'budget', 'symptom', null],
      default: null,
    },
    pendingIntent: { type: String },
    lastShownProducts: { type: [Schema.Types.ObjectId], ref: 'Product', default: [] },
    lastCategories: { type: [String], default: [] },
    resolvedBudget: { type: Number },
    beginnerMode: { type: Boolean, default: false },
    turnCount: { type: Number, default: 0 },
    updatedAt: { type: Date },
  },
  { _id: false }
);

const ChatConversationSchema: Schema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: { type: [ChatMessageSchema], default: [] },
    sessionState: { type: ChatSessionStateSchema, default: () => ({}) },
  },
  { timestamps: true }
);

ChatConversationSchema.index({ user: 1, updatedAt: -1 });
ChatConversationSchema.index({ 'messages.turnId': 1 });

export const ChatConversation =
  mongoose.models.ChatConversation ||
  mongoose.model<IChatConversation>('ChatConversation', ChatConversationSchema);
