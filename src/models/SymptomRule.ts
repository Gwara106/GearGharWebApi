import mongoose, { Schema, Document } from 'mongoose';

/**
 * Diagnostic knowledge base — the expert-system core of the `repair` intent.
 *
 * A symptom maps to a RANKED differential of likely causes, each with the checks
 * a rider can perform and the part categories that fix it. Ranking is by
 * `priorConfidence`, so the assistant produces a deterministic, explainable
 * diagnosis rather than LLM-invented prose.
 */
export interface ILikelyCause {
  cause: string;
  /** 0..1 prior. Drives the ordering of the differential. */
  priorConfidence: number;
  diagnosticChecks: string[];
  fixPartCategories: string[];
  severity: 'low' | 'medium' | 'critical';
}

export interface ISymptomRule extends Document {
  symptomKey: string;
  title: string;
  aliases: string[];
  appliesTo: {
    types: string[];
    engineCcMin?: number;
    engineCcMax?: number;
    motorcycleSlugs: string[];
  };
  likelyCauses: ILikelyCause[];
  /** When true the reply MUST carry a mechanic-escalation clause (server-enforced). */
  escalateToMechanic: boolean;
  safetyCritical: boolean;
  /** Set on machine-type specialisations derived from a curated base rule. */
  derivedFrom?: string;
  source: {
    title: string;
    url?: string;
    kind: 'oem_manual' | 'service_guide' | 'editorial';
  };
  createdAt: Date;
  updatedAt: Date;
}

const LikelyCauseSchema = new Schema<ILikelyCause>(
  {
    cause: { type: String, required: true, trim: true, maxlength: 200 },
    priorConfidence: { type: Number, required: true, min: 0, max: 1 },
    diagnosticChecks: { type: [String], default: [] },
    fixPartCategories: { type: [String], default: [] },
    severity: { type: String, enum: ['low', 'medium', 'critical'], default: 'medium' },
  },
  { _id: false }
);

const SymptomRuleSchema: Schema = new Schema(
  {
    symptomKey: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    aliases: { type: [String], default: [] },
    appliesTo: {
      types: { type: [String], default: [] },
      engineCcMin: { type: Number, min: 0 },
      engineCcMax: { type: Number, min: 0 },
      motorcycleSlugs: { type: [String], default: [] },
    },
    likelyCauses: { type: [LikelyCauseSchema], default: [] },
    escalateToMechanic: { type: Boolean, default: false },
    safetyCritical: { type: Boolean, default: false },
    derivedFrom: { type: String, trim: true },
    source: {
      title: { type: String, required: true, trim: true },
      url: { type: String, trim: true },
      kind: {
        type: String,
        enum: ['oem_manual', 'service_guide', 'editorial'],
        default: 'service_guide',
      },
    },
  },
  { timestamps: true }
);

SymptomRuleSchema.index({ aliases: 1 });
SymptomRuleSchema.index({ safetyCritical: 1 });
SymptomRuleSchema.index({ derivedFrom: 1 });
SymptomRuleSchema.index({ 'appliesTo.types': 1 });
SymptomRuleSchema.index(
  { title: 'text', aliases: 'text' },
  { weights: { title: 10, aliases: 6 }, name: 'symptom_text' }
);

export const SymptomRule =
  mongoose.models.SymptomRule || mongoose.model<ISymptomRule>('SymptomRule', SymptomRuleSchema);
