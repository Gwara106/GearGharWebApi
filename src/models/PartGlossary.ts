import mongoose, { Schema, Document } from 'mongoose';

/**
 * Beginner-education knowledge base. One document per canonical taxonomy slug
 * (keys of PRODUCT_CATEGORY_KEYWORDS), so "what is a tail tidy?" is answered
 * from MongoDB rather than from model memory.
 *
 * Also powers Beginner Mode jargon expansion in the chat widget.
 */
export interface IPartGlossary extends Document {
  partCategory: string;
  title: string;
  whatItIs: string;
  whyUpgrade: string;
  beginnerTips: string[];
  buyingChecklist: string[];
  commonMistakes: string[];
  fitmentDifficulty: 'diy_easy' | 'diy_moderate' | 'workshop';
  relatedCategories: string[];
  safetyCritical: boolean;
  source: {
    title: string;
    url?: string;
    kind: 'oem_manual' | 'service_guide' | 'editorial';
  };
  createdAt: Date;
  updatedAt: Date;
}

const PartGlossarySchema: Schema = new Schema(
  {
    partCategory: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    whatItIs: { type: String, required: true, trim: true, maxlength: 800 },
    whyUpgrade: { type: String, default: '', trim: true, maxlength: 800 },
    beginnerTips: { type: [String], default: [] },
    buyingChecklist: { type: [String], default: [] },
    commonMistakes: { type: [String], default: [] },
    fitmentDifficulty: {
      type: String,
      enum: ['diy_easy', 'diy_moderate', 'workshop'],
      default: 'diy_moderate',
    },
    relatedCategories: { type: [String], default: [] },
    safetyCritical: { type: Boolean, default: false },
    source: {
      title: { type: String, required: true, trim: true },
      url: { type: String, trim: true },
      kind: {
        type: String,
        enum: ['oem_manual', 'service_guide', 'editorial'],
        default: 'editorial',
      },
    },
  },
  { timestamps: true }
);

PartGlossarySchema.index({ relatedCategories: 1 });
PartGlossarySchema.index(
  { title: 'text', whatItIs: 'text', whyUpgrade: 'text' },
  { weights: { title: 10, whatItIs: 4, whyUpgrade: 2 }, name: 'glossary_text' }
);

export const PartGlossary =
  mongoose.models.PartGlossary || mongoose.model<IPartGlossary>('PartGlossary', PartGlossarySchema);
