import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    console.log('PUT request for user ID:', id);
    
    // Get token from cookies or headers
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    // Users can only update their own profile
    if (decoded.userId !== id) {
      console.log('User ID mismatch:', decoded.userId, 'vs', id);
      return NextResponse.json({ message: 'You can only update your own profile' }, { status: 403 });
    }

    console.log('User ID matches, proceeding with update');

    // Parse form data
    const formData = await request.formData();
    
    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Check if user exists
    console.log('Looking for user with ID:', id);
    let user = await usersCollection.findOne({ _id: id });
    console.log('Found user:', user ? 'Yes' : 'No');
    let useObjectId = false;
    
    if (!user) {
      // Try with ObjectId as fallback
      try {
        const objectId = new ObjectId(id);
        user = await usersCollection.findOne({ _id: objectId });
        console.log('Found user with ObjectId:', user ? 'Yes' : 'No');
        useObjectId = true;
        
        if (!user) {
          return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
      } catch (error) {
        console.log('Invalid ObjectId format:', error);
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Handle text fields
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;

    // Handle password change if provided
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ message: 'Current password is required to change password' }, { status: 400 });
      }

      const bcrypt = require('bcryptjs');
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
      }

      // Hash new password
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(newPassword, saltRounds);
    }

    // Handle image upload
    const imageFile = formData.get('image') as File;
    console.log('Image file:', imageFile ? imageFile.name : 'No file');
    
    if (imageFile) {
      try {
        console.log('Starting image upload process...');
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'users');
        console.log('Uploads directory:', uploadsDir);
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1E9);
        const filename = `image-${timestamp}-${randomSuffix}${path.extname(imageFile.name)}`;
        console.log('Generated filename:', filename);
        
        // Save file
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(uploadsDir, filename);
        console.log('Saving file to:', filePath);
        await writeFile(filePath, buffer);

        // Update profilePicture field for Flutter compatibility
        const imagePath = `/uploads/users/${filename}`;
        console.log('Image path for database:', imagePath);
        updateData.profilePicture = imagePath;
        console.log('Image upload completed successfully');

      } catch (error) {
        console.error('Error saving image:', error);
        return NextResponse.json({ message: 'Failed to save image: ' + error.message }, { status: 500 });
      }
    }

    // Update user - use the same ID format that was found
    console.log('Starting database update...');
    console.log('Update data:', updateData);
    console.log('Using ObjectId:', useObjectId);
    
    const updateId = useObjectId ? new ObjectId(id) : id;
    await usersCollection.updateOne(
      { _id: updateId },
      { $set: updateData }
    );
    console.log('Database update completed');

    // Get updated user
    console.log('Retrieving updated user...');
    const updatedUser = await usersCollection.findOne({ _id: updateId });
    if (!updatedUser) {
      console.error('Failed to retrieve updated user');
      return NextResponse.json({ message: 'Failed to retrieve updated user' }, { status: 500 });
    }
    
    console.log('Updated user retrieved successfully');
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    console.error('Update profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
