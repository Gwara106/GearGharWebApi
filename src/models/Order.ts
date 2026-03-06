import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  item: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  totalPrice: number;
  itemName?: string;
  itemImages?: string[];
}

export interface IOrderStatus {
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'received' | 'cancelled' | 'refunded';
  timestamp: Date;
  note?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'received' | 'cancelled' | 'refunded';
  statusHistory: IOrderStatus[];
  shippingAddress: any;
  billingAddress: any;
  paymentMethod: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  paymentId?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
  customerNotes?: string;
  promoCode?: string;
  isGift: boolean;
  giftMessage?: string;
  giftWrap: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, "Item ID is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  totalPrice: {
    type: Number,
    required: [true, "Total price is required"],
    min: [0, "Total price cannot be negative"],
  },
  itemName: {
    type: String,
    required: false,
  },
  itemImages: {
    type: [String],
    required: false,
  },
}, { _id: false });

const orderStatusSchema = new Schema<IOrderStatus>({
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'received', 'cancelled', 'refunded'],
    default: 'pending',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, "Status note cannot exceed 500 characters"]
  }
}, { _id: false });

const OrderSchema: Schema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User ID is required"],
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: [true, "Subtotal is required"],
    min: [0, "Subtotal cannot be negative"],
  },
  tax: {
    type: Number,
    required: [true, "Tax is required"],
    min: [0, "Tax cannot be negative"],
    default: 0,
  },
  shipping: {
    type: Number,
    required: [true, "Shipping cost is required"],
    min: [0, "Shipping cost cannot be negative"],
    default: 0,
  },
  discount: {
    type: Number,
    required: [true, "Discount is required"],
    min: [0, "Discount cannot be negative"],
    default: 0,
  },
  total: {
    type: Number,
    required: [true, "Total is required"],
    min: [0, "Total cannot be negative"],
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'received', 'cancelled', 'refunded'],
    default: 'pending',
  },
  statusHistory: [orderStatusSchema],
  shippingAddress: {
    type: Object,
    required: [true, "Shipping address is required"],
  },
  billingAddress: {
    type: Object,
    required: [true, "Billing address is required"],
  },
  paymentMethod: {
    type: String,
    required: [true, "Payment method is required"],
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
  },
  paymentId: {
    type: String,
    trim: true,
  },
  trackingNumber: {
    type: String,
    trim: true,
  },
  carrier: {
    type: String,
    trim: true,
  },
  estimatedDelivery: {
    type: Date,
  },
  actualDelivery: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, "Order notes cannot exceed 1000 characters"]
  },
  customerNotes: {
    type: String,
    trim: true,
    maxlength: [500, "Customer notes cannot exceed 500 characters"]
  },
  promoCode: {
    type: String,
    trim: true,
  },
  isGift: {
    type: Boolean,
    default: false,
  },
  giftMessage: {
    type: String,
    trim: true,
    maxlength: [500, "Gift message cannot exceed 500 characters"],
    required: function() {
      return this.isGift;
    }
  },
  giftWrap: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });

// Virtual for item count
OrderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for formatted total
OrderSchema.virtual('formattedTotal').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency,
  }).format(this.total);
});

// Virtual for current status info
OrderSchema.virtual('currentStatus').get(function() {
  if (this.statusHistory.length > 0) {
    return this.statusHistory[this.statusHistory.length - 1];
  }
  return {
    status: this.status,
    timestamp: this.createdAt,
    note: 'Order created'
  };
});

// Static method to get order statistics
OrderSchema.statics.getStats = function(userId: string) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$total' }
      }
    }
  ]);
};

// Static method to get all orders for admin
OrderSchema.statics.getAllOrders = function(page = 1, limit = 10, status?: string) {
  const query: any = {};
  if (status) {
    query.status = status;
  }
  
  const queryBuilder = this.find(query)
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  // Only populate items.item if Product model is available
  if (mongoose.models.Product) {
    return queryBuilder.populate('items.item', 'name images');
  } else {
    console.warn('Product model not available, skipping item population');
    return queryBuilder;
  }
};

// Static method to get order counts by status
OrderSchema.statics.getOrderCounts = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Generate unique order number function
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

// Pre-save middleware to generate order number
OrderSchema.pre('save', async function() {
  if (this.isNew) {
    this.orderNumber = generateOrderNumber();
  }
});

// Prevent model overwrite
export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
