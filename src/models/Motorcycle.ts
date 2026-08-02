import mongoose, { Schema, Document } from 'mongoose';

/**
 * Motorcycle catalogue used by the AI assistant for model detection and product
 * compatibility. Kept intentionally simple and easy to expand (new brands/models
 * are just new documents).
 */
// `model` shadows Mongoose's Document.model(), so omit it from the base type.
export interface IMotorcycle extends Omit<Document, 'model'> {
  brand: string;
  model: string;
  /** Lowercase, hyphenated unique key e.g. "yamaha-r15-v4". */
  slug: string;
  type: 'sport' | 'naked' | 'cruiser' | 'adventure' | 'commuter' | 'scooter' | 'offroad' | 'other';
  engineCc?: number;
  yearFrom?: number;
  yearTo?: number;
  /** Braking system fitted as standard — drives fitment and safety guidance. */
  abs?: 'none' | 'cbs' | 'single-channel' | 'dual-channel' | 'switchable';
  fuelType?: 'petrol' | 'electric' | 'hybrid';
  /** Kerb weight in kg, where known — used for tyre and suspension advice. */
  kerbWeightKg?: number;
  /** Alternate spellings the NLU should recognise e.g. ["r15v4", "r15 v4", "yzf r15"]. */
  aliases: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MotorcycleSchema: Schema = new Schema(
  {
    brand: { type: String, required: [true, 'Brand is required'], trim: true },
    model: { type: String, required: [true, 'Model is required'], trim: true },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['sport', 'naked', 'cruiser', 'adventure', 'commuter', 'scooter', 'offroad', 'other'],
      default: 'other',
    },
    engineCc: { type: Number, min: 0 },
    yearFrom: { type: Number },
    yearTo: { type: Number },
    abs: {
      type: String,
      enum: ['none', 'cbs', 'single-channel', 'dual-channel', 'switchable'],
      default: 'none',
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'electric', 'hybrid'],
      default: 'petrol',
    },
    kerbWeightKg: { type: Number, min: 0 },
    aliases: { type: [String], default: [] },
  },
  { timestamps: true }
);

MotorcycleSchema.index({ brand: 1 });
MotorcycleSchema.index({ aliases: 1 });
MotorcycleSchema.index({ type: 1, engineCc: 1 });
MotorcycleSchema.index({ abs: 1 });

export const Motorcycle =
  mongoose.models.Motorcycle || mongoose.model<IMotorcycle>('Motorcycle', MotorcycleSchema);
