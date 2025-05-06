// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Assuming 'better-auth' provides a way to get the session from the request,
// possibly via a helper function or by inspecting cookies directly.
// The exact method depends on 'better-auth' specifics.
// Let's assume a hypothetical `getSessionFromRequest` helper exists or
// we need to check for a specific session cookie.

// Placeholder: Replace with actual Better Auth session retrieval logic
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  // Option 1: Check for a session cookie (replace 'authjs.session-token' with the actual cookie name)
  const sessionCookie = request.cookies.get('authjs.session-token'); // EXAMPLE cookie name
  // You might need more robust validation (e.g., decoding/verifying a JWT)
  return !!sessionCookie; 

  // Option 2: If Better Auth provides a server-side helper for middleware:
  // import { getSession } from 'better-auth/middleware'; // Hypothetical import
  // const session = await getSession(request);
  // return !!session;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes (e.g., everything under /admin)
  const protectedRoutes = ['/admin']; // Add more paths or use wildcards like '/admin/*'

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const authenticated = await isAuthenticated(request);

    if (!authenticated) {
      // Redirect unauthenticated users to the login page
      const loginUrl = new URL('/login', request.url);
      // Optional: Add a callbackUrl query parameter to redirect back after login
      loginUrl.searchParams.set('callbackUrl', pathname);
      console.log(`Unauthenticated access to ${pathname}, redirecting to ${loginUrl.toString()}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow the request to proceed if not protected or if authenticated
  return NextResponse.next();
}

// Configure the matcher to specify which routes the middleware should run on.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the login page itself to avoid redirect loops)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};

// Note: The exact implementation of `isAuthenticated` needs to be confirmed
// based on how Better Auth handles sessions and provides access within middleware.
// Check the 'better-auth' documentation for the recommended approach.
