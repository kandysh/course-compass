
import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedUserSession } from '@/app/actions';
import { AUTH_COOKIE_NAME, type UserSession } from '@/lib/auth.config';
import { decodeId, encodeId } from '@/lib/hashids';

const publicPaths = [
  '/', 
  '/api/', 
  '/_next/', 
  '/static/', 
  '/images/', 
  '/favicon.ico',
  // Auth routes are handled separately now but kept here for broad public path definition
  '/login/student',
  '/login/instructor',
  '/signup/student',
  '/signup/instructor',
];

const authRoutes = [
  '/login/student',
  '/login/instructor',
  '/signup/student',
  '/signup/instructor',
];

/**
 * Checks if the given pathname is considered a public path.
 * @param pathname - The URL pathname to check.
 * @returns True if the path is public, false otherwise.
 */
function isPathPublic(pathname: string): boolean {
  if (publicPaths.includes(pathname)) return true;
  // Check for paths starting with public directory-like paths
  return publicPaths.some(p => p.endsWith('/') && pathname.startsWith(p));
}

/**
 * Middleware function to handle authentication and authorization for requests.
 * It checks for session cookies, validates user sessions, and redirects users
 * based on their authentication status and the requested path.
 * @param request - The incoming NextRequest object.
 * @returns A NextResponse object, either allowing the request or redirecting.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);

  // 1. Pass through Genkit API routes without auth checks here
  // Genkit routes might have their own internal auth or are public by design.
  if (pathname.startsWith('/api/genkit/')) {
    return NextResponse.next();
  }

  // 2. Handle Auth Routes (e.g., /login, /signup)
  if (authRoutes.includes(pathname)) {
    if (cookie?.value) {
      // If there's a cookie, check if the user is already logged in
      const userSession = await getAuthenticatedUserSession();
      if (userSession?.id) {
        // User is logged in, redirect them from auth page to their dashboard
        const dashboardUrl = new URL(`/${userSession.role}/${encodeId(userSession.id)}/dashboard`, request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
    // No valid session or no cookie, allow access to the auth page
    return NextResponse.next();
  }

  // 3. Handle other Public Routes (as defined in publicPaths, excluding authRoutes already handled)
  if (isPathPublic(pathname)) {
    return NextResponse.next();
  }

  // 4. Handle Protected Routes (all remaining routes)
  // At this point, the route is not public and not an auth route. User must be authenticated.

  if (!cookie?.value) {
    // No session cookie found, redirect to the homepage
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Cookie exists, so now we must validate the session
  const userSession = await getAuthenticatedUserSession();

  if (!userSession?.id) {
    // Session cookie was present but invalid (e.g., expired, user deleted, session store issue)
    // Redirect to homepage and attempt to clear the invalid cookie
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete(AUTH_COOKIE_NAME); // Clear the potentially invalid cookie
    return response;
  }

  // User is authenticated (userSession is valid), now perform path-specific authorization
  const pathSegments = pathname.split('/').filter(Boolean); // e.g., ['student', 'hash123', 'dashboard']

  // Check for dashboard or profile pages: /<userType>/<hashUserId>/<pageType>
  if (pathSegments.length === 3 && 
      (pathSegments[0] === 'student' || pathSegments[0] === 'instructor') && 
      (pathSegments[2] === 'dashboard' || pathSegments[2] === 'profile')) {
    const userTypeFromUrl = pathSegments[0];
    const hashUserIdFromUrl = pathSegments[1];
    const decodedUrlUserId = decodeId(hashUserIdFromUrl);

    if (decodedUrlUserId !== userSession.id || userTypeFromUrl !== userSession.role) {
      // URL parameters do not match the authenticated user's session details.
      // Redirect to the logged-in user's correct dashboard.
      const correctDashboardUrl = new URL(`/${userSession.role}/${encodeId(userSession.id)}/dashboard`, request.url);
      return NextResponse.redirect(correctDashboardUrl);
    }
  }
  // Add more specific path authorization checks here if needed for other protected routes.
  // For example, if /courses/[hashId] page has specific authorization rules beyond just being logged in.

  // If all checks pass for a protected route, allow the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for specific static files and Next.js internals.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
