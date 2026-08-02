import mongoose, { Schema, Document } from 'mongoose';

/**
 * A motorcycle the rider owns. Persisted so the assistant never has to ask for
 * the bike twice, and so maintenance intervals can be computed against a real
 * odometer reading.
 */
export interface IGarageEntry {
  motorcycle: mongoose.Types.ObjectId;
  motorcycleSlug: string;
  motorcycleLabel: string;
  nickname?: string;
  year?: number;
  odometerKm?: number;
  odometerUpdatedAt?: Date;
  lastServiceAt?: Date;
  lastServiceKm?: number;
  isPrimary: boolean;
  addedAt: Date;
}

export interface IUserPreferences {
  beginnerMode: boolean;
  ridingStyle?: 'commute' | 'touring' | 'track' | 'offroad' | 'casual';
  budgetBand?: 'budget' | 'mid' | 'premium';
  preferredBrands: string[];
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  name?: string; // Virtual for backward compatibility with mobile
  email: string;
  username?: string; // Mobile app field
  password: string;
  phoneNumber?: string; // Mobile app field
  /** Postal address shown and edited on the profile page. */
  address?: string;
  profilePicture?: string; // Mobile app field
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  /** Rider's motorcycles — powers persistent assistant memory + personalisation. */
  garage: IGarageEntry[];
  preferences: IUserPreferences;
  /** Most-recent-first product ids, capped server-side. Drives "recently viewed". */
  recentlyViewed: mongoose.Types.ObjectId[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GarageEntrySchema = new Schema<IGarageEntry>(
  {
    motorcycle: { type: Schema.Types.ObjectId, ref: 'Motorcycle', required: true },
    motorcycleSlug: { type: String, required: true, trim: true },
    motorcycleLabel: { type: String, required: true, trim: true },
    nickname: { type: String, trim: true, maxlength: 40 },
    year: { type: Number, min: 1950, max: 2100 },
    odometerKm: { type: Number, min: 0 },
    odometerUpdatedAt: { type: Date },
    lastServiceAt: { type: Date },
    lastServiceKm: { type: Number, min: 0 },
    isPrimary: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema: Schema = new Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters long'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  name: {
    type: String,
    trim: true,
    // Virtual getter for backward compatibility with mobile app
    get: function(this: IUser) {
      return `${this.firstName} ${this.lastName}`.trim();
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  profilePicture: {
    type: String,
    default: 'default-profile.png',
    trim: true,
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Role must be either user or admin'
    },
    default: 'user'
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'Status must be either active or inactive'
    },
    default: 'active'
  },
  garage: {
    type: [GarageEntrySchema],
    default: []
  },
  preferences: {
    beginnerMode: { type: Boolean, default: false },
    ridingStyle: {
      type: String,
      enum: ['commute', 'touring', 'track', 'offroad', 'casual'],
    },
    budgetBand: {
      type: String,
      enum: ['budget', 'mid', 'premium'],
    },
    preferredBrands: { type: [String], default: [] }
  },
  recentlyViewed: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    default: []
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Pre-save middleware to handle backward compatibility
UserSchema.pre('save', async function() {
  // Handle migration from old schema to new schema
  if (this.isNew && (this as any).name && !(this as any).firstName) {
    const nameParts = (this as any).name.split(' ');
    (this as any).firstName = nameParts[0] || (this as any).name;
    (this as any).lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  }
});

// Index for better query performance
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
// Assistant memory lookups: "which bike does this user ride?"
UserSchema.index({ 'garage.motorcycle': 1 });
UserSchema.index({ 'garage.motorcycleSlug': 1 });
// Note: email and username indexes are already defined as unique in the schema

// Prevent model overwrite
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
