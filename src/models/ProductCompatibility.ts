import mongoose, { Schema, Document } from 'mongoose';

/**
 * Maps a product to the motorcycle(s) it fits. Scalable by design:
 *  - A specific fitment links one product to one motorcycle.
 *  - A `universal` product fits all bikes (no motorcycle reference needed).
 *
 * Expanding coverage later = inserting more documents; no schema changes.
 */
export interface IProductCompatibility extends Document {
  product: mongoose.Types.ObjectId;
  /** Optional when `universal` is true. */
  motorcycle?: mongoose.Types.ObjectId;
  universal: boolean;
  /** Free-form fitment note, e.g. "Requires OEM clamp adapter". */
  fitmentNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductCompatibilitySchema: Schema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    motorcycle: {
      type: Schema.Types.ObjectId,
      ref: 'Motorcycle',
    },
    universal: { type: Boolean, default: false },
    fitmentNotes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

ProductCompatibilitySchema.index({ motorcycle: 1 });
ProductCompatibilitySchema.index({ product: 1 });
ProductCompatibilitySchema.index({ universal: 1 });
// Prevent duplicate (product, motorcycle) links.
ProductCompatibilitySchema.index({ product: 1, motorcycle: 1 }, { unique: true, sparse: true });

export const ProductCompatibility =
  mongoose.models.ProductCompatibility ||
  mongoose.model<IProductCompatibility>('ProductCompatibility', ProductCompatibilitySchema);
