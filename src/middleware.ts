// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Define all protected routes
const protectedRoutes = ['/dashboard'];

/**
 * Checks if a given path matches a protected route.
 */
const isProtectedRoute = (pathname: string): boolean => {
  return protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
};



export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow requests to auth-related pages (sign-in, sign-up, etc.)
  if (pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // For protected routes, we'll let the client-side AuthGuard handle authentication
  // since we're using localStorage which can't be accessed server-side
  if (isProtectedRoute(pathname)) {
    // Just continue and let the client-side AuthGuard handle it
    return NextResponse.next();
  }

  // Otherwise, just continue
  return NextResponse.next();
}

/**
 * Match all paths except:
 * - Next.js internal files (_next)
 * - Static files (e.g., .css, .js, .png, etc.)
 */
export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
