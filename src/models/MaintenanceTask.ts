import mongoose, { Schema, Document } from 'mongoose';

/**
 * Service/maintenance knowledge base.
 *
 * Grounds the `maintenance` intent: instead of the assistant improvising service
 * advice, every interval, step and warning is read from a document here and
 * carries a `source`. Applicability is expressed by motorcycle TYPE and engine
 * displacement so a small curated set covers the whole catalogue, with optional
 * `motorcycleSlugs` for model-specific overrides.
 */
export interface IMaintenanceSource {
  title: string;
  url?: string;
  kind: 'oem_manual' | 'service_guide' | 'editorial';
}

export interface IMaintenanceTask extends Document {
  taskKey: string;
  title: string;
  summary: string;
  appliesTo: {
    types: string[];
    engineCcMin?: number;
    engineCcMax?: number;
    /** Model-specific override; when non-empty ONLY these bikes match. */
    motorcycleSlugs: string[];
  };
  intervalKm?: number;
  intervalMonths?: number;
  difficulty: 'diy_easy' | 'diy_moderate' | 'workshop';
  steps: string[];
  toolsNeeded: string[];
  warningSigns: string[];
  /** Taxonomy slugs (PRODUCT_CATEGORY_KEYWORDS keys) this task consumes. */
  relatedPartCategories: string[];
  safetyCritical: boolean;
  source: IMaintenanceSource;
  /**
   * Set on machine-type specialisations derived from a curated base document.
   * Absent on hand-authored documents. Kept so knowledge-coverage counts can
   * report authored and derived totals separately.
   */
  derivedFrom?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SourceSchema = new Schema<IMaintenanceSource>(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, trim: true },
    kind: {
      type: String,
      enum: ['oem_manual', 'service_guide', 'editorial'],
      default: 'service_guide',
    },
  },
  { _id: false }
);

const MaintenanceTaskSchema: Schema = new Schema(
  {
    taskKey: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    summary: { type: String, required: true, trim: true, maxlength: 600 },
    appliesTo: {
      types: { type: [String], default: [] },
      engineCcMin: { type: Number, min: 0 },
      engineCcMax: { type: Number, min: 0 },
      motorcycleSlugs: { type: [String], default: [] },
    },
    intervalKm: { type: Number, min: 0 },
    intervalMonths: { type: Number, min: 0 },
    difficulty: {
      type: String,
      enum: ['diy_easy', 'diy_moderate', 'workshop'],
      default: 'diy_moderate',
    },
    steps: { type: [String], default: [] },
    toolsNeeded: { type: [String], default: [] },
    warningSigns: { type: [String], default: [] },
    relatedPartCategories: { type: [String], default: [] },
    safetyCritical: { type: Boolean, default: false },
    source: { type: SourceSchema, required: true },
    derivedFrom: { type: String, trim: true },
  },
  { timestamps: true }
);

MaintenanceTaskSchema.index({ derivedFrom: 1 });

MaintenanceTaskSchema.index({ 'appliesTo.types': 1 });
MaintenanceTaskSchema.index({ 'appliesTo.motorcycleSlugs': 1 });
MaintenanceTaskSchema.index({ relatedPartCategories: 1 });
MaintenanceTaskSchema.index({ safetyCritical: 1 });
MaintenanceTaskSchema.index({ intervalKm: 1 });
MaintenanceTaskSchema.index(
  { title: 'text', summary: 'text', warningSigns: 'text' },
  { weights: { title: 10, summary: 4, warningSigns: 2 }, name: 'maintenance_text' }
);

export const MaintenanceTask =
  mongoose.models.MaintenanceTask ||
  mongoose.model<IMaintenanceTask>('MaintenanceTask', MaintenanceTaskSchema);
