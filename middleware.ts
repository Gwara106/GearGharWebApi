import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

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
  } catch (error) {
    // Invalid token, redirect to login
    const loginUrl = isAdminRoute ? '/admin/login' : '/admin/login';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - admin/login (login page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|admin/login).*)',
  ],
};
