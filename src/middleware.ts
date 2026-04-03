import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("forum_token");
  const { pathname } = request.nextUrl;

  // Allow API routes and static files always
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Already logged in — redirect away from /register
  if (token && pathname === "/register") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Not logged in — force /register
  if (!token && pathname !== "/register") {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|static/).*)"],
};
