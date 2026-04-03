import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("forum_token");
  const { pathname } = request.nextUrl;

  // Allow register page, API routes, and static files
  if (
    pathname === "/register" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // No token = force register
  if (!token) {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  // Block login page and logout — session is permanent
  if (pathname === "/login" || pathname === "/api/auth/logout") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|static/).*)"],
};
