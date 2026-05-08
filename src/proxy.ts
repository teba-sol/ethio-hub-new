import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Define role-based dashboard paths
const roleRoutes = {
  admin: '/dashboard/admin',
  organizer: '/dashboard/organizer',
  artisan: '/dashboard/artisan',
  delivery: '/dashboard/delivery',
  tourist: '/',
};

// Define protected routes and the roles that can access them
const protectedRoutes: { [key: string]: string[] } = {
  '/dashboard/admin': ['admin'],
  '/dashboard/organizer': ['organizer'],
  '/dashboard/artisan': ['artisan'],
  '/dashboard/delivery': ['delivery'],
  '/api/admin': ['admin'],
  '/api/organizer': ['organizer'],
  '/api/artisan': ['artisan'],
  '/api/delivery': ['delivery'],
};

const getRequiredRoles = (pathname: string): string[] | null => {
  for (const route in protectedRoutes) {
    if (pathname.startsWith(route)) {
      return protectedRoutes[route];
    }
  }
  return null;
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('sessionToken')?.value;

  const requiredRoles = getRequiredRoles(pathname);

  if (requiredRoles) {
    if (!token) {
      // For API routes, return a JSON error. For page routes, redirect.
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
      const { payload } = await jose.jwtVerify(token, secret);
      const userRole = payload.role as keyof typeof roleRoutes;

      if (!requiredRoles.includes(userRole)) {
        // For API routes, return a JSON error. For page routes, redirect to unauthorized.
        if (pathname.startsWith('/api/')) {
          return new NextResponse(
            JSON.stringify({ success: false, message: 'Forbidden: Insufficient permissions' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

    } catch (error) {
      // Invalid token
      console.error('Middleware token verification error:', error);
      const response = pathname.startsWith('/api/')
        ? new NextResponse(JSON.stringify({ success: false, message: 'Invalid token' }), { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));
      
      // Clear the invalid cookie
      response.cookies.set('sessionToken', '', { maxAge: -1 });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the login page itself to avoid redirect loops)
     * - unauthorized (the unauthorized page)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|register|unauthorized).+)',
  ],
};