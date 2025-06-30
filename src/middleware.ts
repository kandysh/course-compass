import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUserSession } from "@/app/actions";
import { AUTH_COOKIE_NAME } from "@/lib/auth.config";
import { decodeId, encodeId } from "@/lib/hashids";

const authRoutes = [
  "/student/login",
  "/instructor/login",
  "/student/signup",
  "/instructor/signup",
];

const publicPaths = [
  "/",
  "/api/",
  "/_next/",
  "/static/",
  "/images/",
  "/favicon.ico",
  ...authRoutes,
];

/**
 * Checks if the given pathname is considered a public path.
 * @param pathname - The URL pathname to check.
 * @returns True if the path is public, false otherwise.
 */
function isPathPublic(pathname: string): boolean {
  if (publicPaths.includes(pathname)) return true;
  // Check for paths starting with public directory-like paths
  return publicPaths.some((p) => p.endsWith("/") && pathname.startsWith(p));
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
  const homeUrl = new URL("/", request.url);
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);

  // 1. Pass through Genkit API routes without auth checks here
  if (pathname.startsWith("/api/genkit/")) {
    return NextResponse.next();
  }

  // 2. Handle Auth Routes
  if (authRoutes.includes(pathname)) {
    if (cookie?.value) {
      const userSession = await getAuthenticatedUserSession();
      if (userSession?.id) {
        const dashboardUrl = new URL(
          `/${userSession.role}/${encodeId(userSession.id)}/dashboard`,
          request.url,
        );
        return NextResponse.redirect(dashboardUrl);
      }
    }
    return NextResponse.next();
  }

  // 3. Handle other Public Routes
  if (isPathPublic(pathname)) {
    return NextResponse.next();
  }

  // 4. Handle Protected Routes (all remaining routes)

  if (!cookie?.value) {
    return NextResponse.redirect(homeUrl);
  }

  const userSession = await getAuthenticatedUserSession();

  if (!userSession?.id) {
    const response = NextResponse.redirect(homeUrl);
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  const pathSegments = pathname.split("/").filter(Boolean);

  if (
    pathSegments.length === 3 &&
    (pathSegments[0] === "student" || pathSegments[0] === "instructor") &&
    (pathSegments[2] === "dashboard" || pathSegments[2] === "profile")
  ) {
    const userTypeFromUrl = pathSegments[0];
    const hashUserIdFromUrl = pathSegments[1];
    const decodedUrlUserId = decodeId(hashUserIdFromUrl);

    if (
      decodedUrlUserId !== userSession.id ||
      userTypeFromUrl !== userSession.role
    ) {
      const correctDashboardUrl = new URL(
        `/${userSession.role}/${encodeId(userSession.id)}/dashboard`,
        request.url,
      );
      return NextResponse.redirect(correctDashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
