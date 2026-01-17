import { User, IUser } from '../models/User';
import mongoose from 'mongoose';

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | null>;
  findById(id: string): Promise<IUser | null>;
  create(userData: Partial<IUser>): Promise<IUser>;
  updateLastLogin(userId: string): Promise<void>;
  emailExists(email: string): Promise<boolean>;
  usernameExists(username: string): Promise<boolean>;
}

export class UserRepository implements IUserRepository {
  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email: email.toLowerCase() }).exec();
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Database error while finding user');
    }
  }

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      return await User.findById(id).exec();
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Database error while finding user');
    }
  }

  /**
   * Create a new user
   */
  async create(userData: Partial<IUser>): Promise<IUser> {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle duplicate email error
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('Email already exists');
      }
      
      throw new Error('Database error while creating user');
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      
      await User.findByIdAndUpdate(
        userId,
        { lastLogin: new Date() },
        { new: true }
      ).exec();
    } catch (error) {
      console.error('Error updating last login:', error);
      throw new Error('Database error while updating last login');
    }
  }

  /**
   * Check if email already exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase() 
      }).select('_id').exec();
      
      return !!existingUser;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw new Error('Database error while checking email');
    }
  }

  /**
   * Check if username already exists
   */
  async usernameExists(username: string): Promise<boolean> {
    try {
      const existingUser = await User.findOne({ 
        username: username.trim().toLowerCase() 
      }).select('_id').exec();
      
      return !!existingUser;
    } catch (error) {
      console.error('Error checking username existence:', error);
      throw new Error('Database error while checking username');
    }
  }
}
