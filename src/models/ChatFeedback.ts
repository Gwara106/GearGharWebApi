import mongoose, { Schema, Document } from 'mongoose';

/**
 * Per-turn human judgement (thumbs up/down). Joined to ChatConversation via
 * `turnId` so satisfaction can be sliced by intent, answer tier and whether the
 * reply was LLM-generated — the human-evaluation half of the project's
 * evaluation framework.
 */
export interface IChatFeedback extends Document {
  sessionId: string;
  turnId: string;
  user?: mongoose.Types.ObjectId;
  rating: 1 | -1;
  reason?: 'wrong_fit' | 'not_helpful' | 'confusing' | 'too_generic' | 'inaccurate' | 'great';
  comment?: string;
  /** 0 = deterministic fallback, 1 = verified template, 2 = verified LLM answer. */
  answerTier: number;
  intent?: string;
  aiGenerated: boolean;
  createdAt: Date;
}

const ChatFeedbackSchema: Schema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    turnId: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, enum: [1, -1] },
    reason: {
      type: String,
      enum: ['wrong_fit', 'not_helpful', 'confusing', 'too_generic', 'inaccurate', 'great'],
    },
    comment: { type: String, maxlength: 500, trim: true },
    answerTier: { type: Number, default: 0, min: 0, max: 2 },
    intent: { type: String },
    aiGenerated: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One feedback record per turn — re-voting overwrites (upsert in the route).
ChatFeedbackSchema.index({ turnId: 1 }, { unique: true });
ChatFeedbackSchema.index({ rating: 1, createdAt: -1 });
ChatFeedbackSchema.index({ intent: 1, rating: 1 });

export const ChatFeedback =
  mongoose.models.ChatFeedback || mongoose.model<IChatFeedback>('ChatFeedback', ChatFeedbackSchema);
