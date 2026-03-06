import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export async function authenticateToken(request: NextRequest): Promise<{ success: boolean; user?: AuthenticatedUser; message?: string }> {
  try {
    console.log('Auth: MongoDB URI:', process.env.MONGODB_URI);
    
    // Get token from cookie or header
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return { success: false, message: 'No token provided' };
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    
    return { success: true, user: decoded };
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
