import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // Validate input
    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user with valid reset token
    const user = await usersCollection.findOne({
      resetToken: tokenHash,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Return user info (without sensitive data)
    const { password, resetToken, resetTokenExpires, ...userWithoutSensitive } = user;

    return NextResponse.json({
      message: 'Token is valid',
      user: {
        email: userWithoutSensitive.email,
        firstName: userWithoutSensitive.firstName,
        lastName: userWithoutSensitive.lastName
      }
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
