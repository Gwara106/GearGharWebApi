import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { getCollection } from '@/lib/db';
import { comparePasswords, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find admin in database
    const adminsCollection = await getCollection('admins');
    const admin = await adminsCollection.findOne({ email: email.toLowerCase() });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { message: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, admin.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Check if admin account is active
    if (admin.status === 'inactive') {
      return NextResponse.json(
        { message: 'Admin account is inactive' },
        { status: 403 }
      );
    }

    // Generate token with admin role
    const token = generateToken(admin._id.toString(), admin.email, 'admin');

    // Update last login
    await adminsCollection.updateOne(
      { _id: admin._id },
      { $set: { lastLogin: new Date() } }
    );

    return NextResponse.json({
      success: true,
      token,
      admin: {
        _id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during admin login' },
      { status: 500 }
    );
  }
}
