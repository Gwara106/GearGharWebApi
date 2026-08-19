import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/src/config/database';
import { authenticateToken } from '@/app/api/_lib/auth';
import { User } from '@/src/models/User';

/**
 * Authenticated user profile, backed by MongoDB.
 *
 * This route previously served an in-memory `mockUsers` array. GET ignored the
 * token and always returned `mockUsers[0]`; PUT ignored the token, merged the
 * submitted first/last name into `mockUsers[0]` and returned it. Because
 * app/dashboard/page.tsx passes the PUT response straight to
 * `AuthContext.updateUser()` — which persists it to the `user` cookie — that
 * mock identity (`_id: '1'`, john.doe@example.com, +1234567890,
 * "123 Main St, City, State 12345", profilePicture '/placeholder.svg')
 * overwrote the real signed-in user across the whole application, and survived
 * reloads. It also caused `/api/auth/1` to 403, because the JWT carries the
 * real Mongo id while the cookie claimed `_id: '1'`.
 *
 * Field names follow the User model: `phoneNumber` (not `phone`) and
 * `profilePicture` (not `image`/`avatar`).
 */

/** Strips secrets and normalises the shape the client consumes. */
function toPublicUser(user: any) {
  return {
    _id: String(user._id),
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    name: [user.firstName, user.lastName].filter(Boolean).join(' '),
    email: user.email,
    username: user.username,
    phoneNumber: user.phoneNumber ?? '',
    address: user.address ?? '',
    profilePicture: user.profilePicture ?? '',
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** GET /api/user/profile — the signed-in user, resolved from the JWT. */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateToken(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ message: auth.message || 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(auth.user.id)) {
      return NextResponse.json({ message: 'Invalid user identifier in token' }, { status: 401 });
    }

    const user: any = await User.findById(auth.user.id).select('-password').lean();
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile retrieved successfully',
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/user/profile
 * Body: { firstName, lastName, phoneNumber?, address? }
 *
 * Updates only the signed-in user. The id comes from the verified token, never
 * from the request body, so a client cannot target another account.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateToken(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ message: auth.message || 'Authentication required' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body?.lastName === 'string' ? body.lastName.trim() : '';

    if (!firstName || !lastName) {
      return NextResponse.json({ message: 'First name and last name are required' }, { status: 400 });
    }

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(auth.user.id)) {
      return NextResponse.json({ message: 'Invalid user identifier in token' }, { status: 401 });
    }

    const update: Record<string, any> = { firstName, lastName };

    // Accept `phone` as well as `phoneNumber` so the older dashboard payload
    // keeps working, but persist under the model's field name.
    const phoneNumber = body?.phoneNumber ?? body?.phone;
    if (typeof phoneNumber === 'string') update.phoneNumber = phoneNumber.trim();
    if (typeof body?.address === 'string') update.address = body.address.trim();

    const user: any = await User.findByIdAndUpdate(
      auth.user.id,
      { $set: update },
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
