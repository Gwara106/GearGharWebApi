import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation';
import { getCollection } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input (without confirmPassword and agreeToTerms for API)
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password } = validation.data;

    // Check if user already exists
    const usersCollection = await getCollection('users');
    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    };

    const result = await usersCollection.insertOne(newUser);

    // Generate token
    const token = generateToken(result.insertedId.toString(), email, 'user');

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          _id: result.insertedId,
          firstName,
          lastName,
          email,
          role: 'user',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
