import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simple JWT verification for middleware (without external libraries)
function verifyJWT(token: string): any {
  try {
    // Split token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token structure');
    }

    // Decode payload (base64)
    const payload = JSON.parse(atob(parts[1]));
    
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

  console.log('Middleware checking path:', pathname);

  // Define protected routes (exclude login page)
  const adminRoutes = ['/admin/dashboard', '/admin/users'];
  const userRoutes = ['/user'];
  const publicRoutes = ['/admin/login'];

  // Check if the path starts with protected routes
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isUserRoute = userRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  console.log('Route checks:', { isAdminRoute, isUserRoute, isPublicRoute });

  // If it's a public route or not a protected route, continue
  if (isPublicRoute || (!isAdminRoute && !isUserRoute)) {
    console.log('Allowing access to public/non-protected route');
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;
  console.log('Token found in cookies:', !!token);

  // If no token, redirect to login
  if (!token) {
    console.log('No token found, redirecting to login');
    const loginUrl = isAdminRoute ? '/admin/login' : '/admin/login';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // Verify token (simple verification without crypto)
  const decoded = verifyJWT(token);
  if (!decoded) {
    console.log('Token verification failed, redirecting to login');
    const loginUrl = isAdminRoute ? '/admin/login' : '/admin/login';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  console.log('Token decoded successfully:', { userId: decoded.userId, role: decoded.role });

  // For admin routes, check if user has admin role
  if (isAdminRoute && decoded.role !== 'admin') {
    console.log('Admin route access denied - role is not admin:', decoded.role);
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // For user routes, check if user is authenticated
  if (isUserRoute && !decoded.userId) {
    console.log('User route access denied - no userId');
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  console.log('Access granted to protected route');
  
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
