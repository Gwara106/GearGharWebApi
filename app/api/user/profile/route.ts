import { NextRequest, NextResponse } from 'next/server';

// Mock user data - in a real app, this would come from a database
let mockUsers = [
  {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'user' as const,
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    phone: '+1234567890',
    address: '123 Main St, City, State 12345',
    profilePicture: '/placeholder.svg'
  },
  {
    _id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    role: 'user' as const,
    status: 'active' as const,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    phone: '+0987654321',
    address: '456 Oak Ave, Town, State 67890'
  }
];

export async function GET(request: NextRequest) {
  try {
    // Get user from token (in a real app, you'd validate JWT)
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // For demo purposes, we'll just return the first user
    // In a real app, you'd extract user ID from JWT and find them in database
    const user = mockUsers[0];

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, address } = body;

    // Validate input
    if (!firstName || !lastName) {
      return NextResponse.json({ message: 'First name and last name are required' }, { status: 400 });
    }

    // For demo purposes, we'll update the first user
    // In a real app, you'd extract user ID from JWT and update them in database
    const userIndex = 0;
    if (userIndex >= mockUsers.length) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Update user data
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      firstName,
      lastName,
      phone: phone || mockUsers[userIndex].phone,
      address: address || mockUsers[userIndex].address,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: mockUsers[userIndex]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
