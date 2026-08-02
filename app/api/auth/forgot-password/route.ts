import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import crypto from 'crypto';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      // Don't reveal that user doesn't exist
      return NextResponse.json({
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

    // In production, you would send an email here.
    // The reset link contains a sensitive token, so it is NOT logged.
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log('Password reset requested; reset link generated.');

    // TODO: Implement email sending
    // Example email service integration:
    // await sendPasswordResetEmail(email, resetLink);

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // In development, return the token for testing
      ...(process.env.NODE_ENV !== 'production' && { resetToken, resetLink })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
