import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  name?: string; // Virtual for backward compatibility with mobile
  email: string;
  username?: string; // Mobile app field
  password: string;
  phoneNumber?: string; // Mobile app field
  profilePicture?: string; // Mobile app field
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
UserSchema.pre('save', async function(next) {
  // Handle migration from old schema to new schema
  if (this.isNew && (this as any).name && !(this as any).firstName) {
    const nameParts = (this as any).name.split(' ');
    (this as any).firstName = nameParts[0] || (this as any).name;
    (this as any).lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  }
  next();
});

// Index for better query performance
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });

// Prevent model overwrite
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
