import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  sku: string;
  stock: number;
  images: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  tags: string[];
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
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: ['electronics', 'clothing', 'accessories', 'sports', 'home', 'other'],
      message: 'Invalid category'
    }
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
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ sku: 1 });

// Prevent model overwrite
export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
