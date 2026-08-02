import mongoose, { Schema, Document } from 'mongoose';

/**
 * Every time the generated reply breaks the Grounding Invariant (INV-G) — i.e.
 * asserts a fact that is not traceable to a MongoDB document retrieved for that
 * turn — the violation is recorded here BEFORE the reply is suppressed.
 *
 * This collection is the measurement instrument for the project's central claim:
 *   hallucination rate = violating turns / total generated turns
 * It is written by the verification layer (src/services/grounding.service.ts)
 * and aggregated by GET /api/chat/analytics.
 */
export type ViolationType =
  | 'schema_invalid'
  | 'unknown_product_id'
  | 'unknown_knowledge_id'
  | 'price_mismatch'
  | 'unlisted_entity'
  | 'uncited_claim'
  | 'missing_escalation'
  | 'empty_answer';

// `model` shadows Mongoose's Document.model(), so omit it from the base type
// (same pattern as IMotorcycle).
export interface IGroundingViolation extends Omit<Document, 'model'> {
  sessionId: string;
  turnId: string;
  user?: mongoose.Types.ObjectId;
  violationType: ViolationType;
  /** The exact text span that failed verification (truncated). */
  offendingSpan: string;
  detail?: string;
  candidateProductIds: mongoose.Types.ObjectId[];
  candidateKnowledgeIds: string[];
  model: string;
  attempt: number;
  resolvedBy: 'retry' | 'fallback' | 'unresolved';
  createdAt: Date;
}

const GroundingViolationSchema: Schema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    turnId: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    violationType: {
      type: String,
      required: true,
      enum: [
        'schema_invalid',
        'unknown_product_id',
        'unknown_knowledge_id',
        'price_mismatch',
        'unlisted_entity',
        'uncited_claim',
        'missing_escalation',
        'empty_answer',
      ],
    },
    offendingSpan: { type: String, default: '', maxlength: 500 },
    detail: { type: String, maxlength: 500 },
    candidateProductIds: { type: [Schema.Types.ObjectId], ref: 'Product', default: [] },
    candidateKnowledgeIds: { type: [String], default: [] },
    model: { type: String, default: '' },
    attempt: { type: Number, default: 1 },
    resolvedBy: {
      type: String,
      enum: ['retry', 'fallback', 'unresolved'],
      default: 'unresolved',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

GroundingViolationSchema.index({ violationType: 1, createdAt: -1 });
GroundingViolationSchema.index({ createdAt: -1 });

export const GroundingViolation =
  mongoose.models.GroundingViolation ||
  mongoose.model<IGroundingViolation>('GroundingViolation', GroundingViolationSchema);
