import express from 'express';
import { ObjectId } from 'mongodb';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/adminAuth';
import { uploadSingleUserImage } from '../middleware/upload';
import { connectToDatabase } from '../../lib/db';
import bcrypt from 'bcryptjs';

const router = express.Router();

// POST /api/admin/users - Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, uploadSingleUserImage, async (req: AuthenticatedRequest, res) => {
  try {
    const { firstName, lastName, email, password, role = 'user' } = req.body;
    
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

    // Create new user object
    const newUser: any = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add image path if uploaded (update both fields for compatibility)
    if (req.file) {
      const imagePath = `/uploads/users/${req.file.filename}`;
      newUser.image = imagePath;
      newUser.profilePicture = imagePath;
    }

    const result = await usersCollection.insertOne(newUser);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;
    const userWithId = { ...userWithoutPassword, _id: result.insertedId };

    res.status(201).json({
      message: 'User created successfully',
      user: userWithId,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// GET /api/admin/users - Get all users with pagination (admin only)
router.get('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const role = req.query.role as string;
    const status = req.query.status as string;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({ 
        message: 'Page must be greater than 0' 
      });
    }
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ 
        message: 'Limit must be between 1 and 100' 
      });
    }

    // Build query filter
    const filter: any = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      filter.role = role;
    }
    if (status) {
      filter.status = status;
    }

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get total count
    const total = await usersCollection.countDocuments(filter);

    // Get users with pagination
    console.log('Filter:', filter);
    console.log('Skip:', skip, 'Limit:', limit);
    const users = await usersCollection
      .find(filter)
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('Users found:', users.length);
    console.log('Users data:', users);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// GET /api/admin/users/:id - Get user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;
    
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.json({
      message: 'User retrieved successfully',
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// PUT /api/admin/users/:id - Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, uploadSingleUserImage, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;
    const { firstName, lastName, email, role, status } = req.body;
    
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Check if user exists
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!existingUser) {
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
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    // Add image path if uploaded (update both fields for compatibility)
    if (req.file) {
      const imagePath = `/uploads/users/${req.file.filename}`;
      updateData.image = imagePath;
      updateData.profilePicture = imagePath;
    }

    // Update user
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    // Get updated user
    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// DELETE /api/admin/users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;
    
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Check if user exists
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!existingUser) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user?.userId) {
      return res.status(400).json({ 
        message: 'Cannot delete your own account' 
      });
    }

    // Delete user
    await usersCollection.deleteOne({ _id: new ObjectId(userId) });

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

export { router as adminUsersRouter };
