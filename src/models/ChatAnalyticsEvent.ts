import mongoose, { Schema, Document } from 'mongoose';

/**
 * One denormalised event per user turn. Purpose-built for the thesis analytics
 * dashboard so aggregations (most searched models, top categories, most
 * recommended products, engagement) stay cheap and index-friendly.
 */
export interface IChatAnalyticsEvent extends Document {
  sessionId: string;
  /** Joins this event to the transcript turn, its feedback and its violations. */
  turnId?: string;
  user?: mongoose.Types.ObjectId;
  intent: string;
  motorcycleSlug?: string;
  motorcycleLabel?: string;
  categories: string[];
  recommendedProducts: mongoose.Types.ObjectId[];
  /** Knowledge documents cited, e.g. "SymptomRule:overheating". */
  knowledgeRefs: string[];
  aiGenerated: boolean;
  /** 0 = deterministic fallback, 1 = verified template, 2 = verified LLM answer. */
  answerTier: number;
  nluConfidence: number;
  /** Grounding-invariant breaches on this turn — the hallucination metric. */
  verificationFailures: number;
  latencyMs: number;
  createdAt: Date;
}

const ChatAnalyticsEventSchema: Schema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    turnId: { type: String, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    intent: { type: String, default: 'general', index: true },
    motorcycleSlug: { type: String, index: true },
    motorcycleLabel: { type: String },
    categories: { type: [String], default: [], index: true },
    recommendedProducts: { type: [Schema.Types.ObjectId], ref: 'Product', default: [] },
    knowledgeRefs: { type: [String], default: [], index: true },
    aiGenerated: { type: Boolean, default: false },
    answerTier: { type: Number, default: 0, min: 0, max: 2, index: true },
    nluConfidence: { type: Number, default: 0 },
    verificationFailures: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ChatAnalyticsEventSchema.index({ createdAt: -1, intent: 1 });

export const ChatAnalyticsEvent =
  mongoose.models.ChatAnalyticsEvent ||
  mongoose.model<IChatAnalyticsEvent>('ChatAnalyticsEvent', ChatAnalyticsEventSchema);
