import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

/**
 * Shape actually signed by lib/auth.ts `generateToken`: `{ userId, email, role }`.
 * Older/mobile tokens may carry `id` or `sub` instead, so all three are accepted.
 */
interface JwtPayloadShape {
  userId?: string;
  id?: string;
  sub?: string;
  email: string;
  role: 'user' | 'admin';
}

/**
 * Normalises the verified payload onto AuthenticatedUser.
 *
 * The token is signed with `userId` but this helper previously cast it straight
 * to `AuthenticatedUser`, which declares `id`. A cast does not rename anything,
 * so `auth.user.id` was `undefined` on every route using this helper — silently
 * turning `User.findById(auth.user.id)` into a lookup for `undefined`.
 */
function toAuthenticatedUser(payload: JwtPayloadShape): AuthenticatedUser | null {
  const id = payload.userId || payload.id || payload.sub;
  if (!id) return null;
  return { id: String(id), email: payload.email, role: payload.role };
}

export async function authenticateToken(request: NextRequest): Promise<{ success: boolean; user?: AuthenticatedUser; message?: string }> {
  try {
    // Get token from cookie or header
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return { success: false, message: 'No token provided' };
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadShape;

    const user = toAuthenticatedUser(decoded);
    if (!user) {
      return { success: false, message: 'Token is missing a user identifier' };
    }

    return { success: true, user };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, message: 'Invalid token' };
    }
    console.error('Authentication error:', error);
    return { success: false, message: 'Internal server error' };
  }
}

export function requireAdmin(user: AuthenticatedUser): { success: boolean; message?: string } {
  if (!user) {
    return { success: false, message: 'Authentication required' };
  }

  if (user.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }

  return { success: true };
}
