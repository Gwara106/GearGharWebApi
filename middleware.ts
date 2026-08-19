import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple JWT verification for middleware (without external libraries)

function base64urlDecode(str: string): string {
  // Replace base64url characters with base64 characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  while (base64.length % 4) base64 += '=';
  return atob(base64);
}

function verifyJWT(token: string): any {
  try {
    // Split token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token structure');
    }

    // Decode payload (base64url)
    const payload = JSON.parse(base64urlDecode(parts[1]));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes (exclude login page)
  const adminRoutes = ['/admin/dashboard', '/admin/users'];
  const userRoutes = ['/user'];
  const publicRoutes = ['/admin/login'];

  // Check if the path starts with protected routes
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isUserRoute = userRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If it's a public route or not a protected route, continue
  if (isPublicRoute || (!isAdminRoute && !isUserRoute)) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;

  // If no token, redirect to login
  if (!token) {
    const loginUrl = isAdminRoute ? '/admin/login' : '/admin/login';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // Verify token (simple verification without crypto)
  const decoded = verifyJWT(token);
  if (!decoded) {
    const loginUrl = isAdminRoute ? '/admin/login' : '/admin/login';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // For admin routes, check if user has admin role
  if (isAdminRoute && decoded.role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // For user routes, check if user is authenticated
  if (isUserRoute && !decoded.userId) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  
  // Add user info to headers for the server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', decoded.userId);
  requestHeaders.set('x-user-email', decoded.email);
  requestHeaders.set('x-user-role', decoded.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match only specific routes that need protection
     * Exclude:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (static assets)
     * - admin/login (login page)
     */
    '/admin/:path*',
    '/user/:path*',
  ],
};
