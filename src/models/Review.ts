import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  rating: number;
  title: string;
  content: string;
  helpful: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  userName: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Review content is required'],
    trim: true,
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  helpful: {
    type: Number,
    default: 0,
    min: [0, 'Helpful count cannot be negative']
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ rating: 1 });

// Prevent model overwrite
export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
