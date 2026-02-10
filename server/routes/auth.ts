import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../lib/db';
import { ObjectId } from 'mongodb';
import { setTokenCookieServer, setUserCookieServer, clearAuthCookiesServer } from '../../lib/server-cookies';
import { uploadSingleUserImage } from '../middleware/upload';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const PASSWORD_RESET_SECRET = process.env.PASSWORD_RESET_SECRET || 'password-reset-secret-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertedId.toString(), 
        email,
        role: 'user'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;
    const userWithId = { ...userWithoutPassword, _id: result.insertedId };

    // Set cookies
    setTokenCookieServer(res, token);
    setUserCookieServer(res, userWithId);

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithId,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    // Set cookies
    setTokenCookieServer(res, token);
    setUserCookieServer(res, userWithoutPassword);

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get user profile (protected route)
router.get('/profile', async (req, res) => {
  try {
    // Try to get token from cookie first, then from header as fallback
    const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    
    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        message: 'Invalid token' 
      });
    }
    console.error('Profile error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update user profile (protected route)
router.put('/profile', async (req, res) => {
  try {
    // Try to get token from cookie first, then from header as fallback
    const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    
    const { firstName, lastName } = req.body;

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Update user
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: { 
          firstName,
          lastName,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Get updated user
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
    const { password: _, ...userWithoutPassword } = updatedUser as any;

    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        message: 'Invalid token' 
      });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Logout user
router.post('/logout', async (_req, res) => {
  // Clear auth cookies
  clearAuthCookiesServer(res);
  res.json({ message: 'Logout successful' });
});

// PUT /api/auth/:id - Update user profile with image support
router.put('/:id', uploadSingleUserImage, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, currentPassword, newPassword } = req.body;
    
    // Try to get token from cookie first, then from header as fallback
    const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    
    // Users can only update their own profile
    if (decoded.userId !== id) {
      return res.status(403).json({ 
        message: 'You can only update your own profile' 
      });
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;

    // Handle password change if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          message: 'Current password is required to change password' 
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, (user as any).password);
      if (!isValidPassword) {
        return res.status(400).json({ 
          message: 'Current password is incorrect' 
        });
      }

      // Hash new password
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(newPassword, saltRounds);
    }

    // Add image path if uploaded (update both fields for compatibility)
    if (req.file) {
      const imagePath = `/uploads/users/${req.file.filename}`;
      updateData.image = imagePath;
      updateData.profilePicture = imagePath;
    }

    // Update user
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Get updated user
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    const { password: _, ...userWithoutPassword } = updatedUser as any;

    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        message: 'Invalid token' 
      });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Forgot password - send reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ 
        message: 'Email is required' 
      });
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      // Don't reveal that user doesn't exist
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token expiration (15 minutes)
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Save reset token to database
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: {
          resetToken: resetTokenHash,
          resetTokenExpires
        }
      }
    );

    // In production, you would send an email here
    // For now, we'll just log the reset link (in development)
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log('Password reset link:', resetLink);

    // TODO: Implement email sending
    // Example email service integration:
    // await sendPasswordResetEmail(email, resetLink);

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // In development, return the token for testing
      ...(process.env.NODE_ENV !== 'production' && { resetToken, resetLink })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Reset password - confirm with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({ 
        message: 'Token and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user with valid reset token
    const user = await usersCollection.findOne({
      resetToken: resetTokenHash,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          resetToken: 1,
          resetTokenExpires: 1
        }
      }
    );

    res.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Verify reset token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        message: 'Token is required' 
      });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user with valid reset token
    const user = await usersCollection.findOne({
      resetToken: resetTokenHash,
      resetTokenExpires: { $gt: new Date() }
    },
    { projection: { password: 0, resetToken: 0 } }
    );

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    res.json({
      message: 'Token is valid',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName
      }
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

export { router as authRouter };
