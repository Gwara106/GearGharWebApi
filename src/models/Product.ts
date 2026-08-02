import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  currency: string;
  originalPriceUSD?: number;
  category: string;
  /** Canonical accessory-taxonomy slug (e.g. "exhaust", "handlebar"). Set by the
   * normalisation script; used for precise, leak-free retrieval and analytics. */
  partCategory?: string;
  brand: string;
  sku: string;
  stock: number;
  images: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  tags: string[];
  /** Structured attributes for deterministic product comparison (spec diffing). */
  specs?: Map<string, string>;
  /** Bullet-point selling points shown on the PDP and used by the assistant. */
  features: string[];
  /** Denormalised review aggregates — used for retrieval ranking + explanations. */
  ratingAvg?: number;
  ratingCount?: number;
  /** How hard this part is to fit; surfaced to beginners as an explanation chip. */
  fitmentDifficulty?: 'diy_easy' | 'diy_moderate' | 'workshop';
  /** Who and what this product is for, in one plain-language sentence. */
  usageRecommendation?: string;
  /** 1 (plug and play) … 5 (specialist workshop equipment required). */
  installationDifficulty?: number;
  /** True when a first-time rider can choose and fit this without guidance. */
  beginnerFriendly?: boolean;
  /** How much this part affects rider safety — drives warnings and ranking. */
  safetyImpact?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  /** True when the part fits essentially any motorcycle (no fitment lookup). */
  universalFit?: boolean;
  warrantyMonths?: number;
  weightGrams?: number;
  /** Denormalised popularity signals used for "popular" sorting. */
  viewCount?: number;
  salesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['INR', 'USD'],
    default: 'INR'
  },
  originalPriceUSD: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: ['electronics', 'clothing', 'accessories', 'sports', 'home', 'other'],
      message: 'Invalid category'
    }
  },
  partCategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Product brand is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'Product SKU is required'],
    unique: true,
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  images: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'out_of_stock'],
      message: 'Status must be active, inactive, or out_of_stock'
    },
    default: 'active'
  },
  tags: {
    type: [String],
    default: []
  },
  specs: {
    type: Map,
    of: String,
    default: undefined
  },
  features: {
    type: [String],
    default: []
  },
  usageRecommendation: {
    type: String,
    trim: true,
    maxlength: [300, 'Usage recommendation cannot exceed 300 characters']
  },
  installationDifficulty: {
    type: Number,
    min: [1, 'Installation difficulty ranges from 1 to 5'],
    max: [5, 'Installation difficulty ranges from 1 to 5']
  },
  beginnerFriendly: {
    type: Boolean,
    default: false
  },
  safetyImpact: {
    type: String,
    enum: ['none', 'low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  universalFit: {
    type: Boolean,
    default: false
  },
  warrantyMonths: {
    type: Number,
    min: 0
  },
  weightGrams: {
    type: Number,
    min: 0
  },
  viewCount: {
    type: Number,
    min: 0,
    default: 0
  },
  salesCount: {
    type: Number,
    min: 0,
    default: 0
  },
  ratingAvg: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingCount: {
    type: Number,
    min: 0,
    default: 0
  },
  fitmentDifficulty: {
    type: String,
    enum: ['diy_easy', 'diy_moderate', 'workshop']
  }
}, {
  timestamps: true
});

ProductSchema.pre('validate', async function () {
  const doc = this as any;

  if (doc.sku === undefined || doc.sku === null || String(doc.sku).trim() === '') {
    const token = (value: unknown, max: number): string =>
      String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, max)
        .replace(/-$/, '');

    const idPart = String(doc._id || '').slice(-6).toUpperCase() || 'UNKNOWN';
    const catPart = token(doc.partCategory || doc.category || 'MISC', 6);
    const namePart = token(doc.name, 14);

    doc.sku = ['LEG', catPart, namePart, idPart].filter(Boolean).join('-');
  }
});

// Indexes for better query performance
ProductSchema.index({ category: 1 });
ProductSchema.index({ partCategory: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ ratingAvg: -1 });
// Covering index for the assistant's category gate (status + category + price band).
ProductSchema.index({ status: 1, partCategory: 1, price: 1 });
// Storefront facets: brand/category filtering combined with the common sorts.
ProductSchema.index({ status: 1, brand: 1, partCategory: 1 });
ProductSchema.index({ status: 1, ratingAvg: -1, ratingCount: -1 });
ProductSchema.index({ status: 1, salesCount: -1 });
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ universalFit: 1 });
ProductSchema.index({ beginnerFriendly: 1 });
// Full-text retrieval for the assistant. Replaces unindexed $regex collection
// scans in product-retrieval.service.ts. Weighted so name matches dominate.
ProductSchema.index(
  { name: 'text', tags: 'text', description: 'text' },
  { weights: { name: 10, tags: 5, description: 1 }, name: 'product_text' }
);
// Note: sku index is already defined as unique in the schema

// Prevent model overwrite
export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
