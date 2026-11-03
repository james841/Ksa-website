import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast first gate for private areas: no session cookie means a real redirect
 * before any page code runs. This only checks that a cookie exists.
 * The real check (valid session, admin role) happens on the server in
 * requireUser() / requireAdmin() on every page and every server action.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("ksa_session") && !request.cookies.has("__Host-ksa_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/learn/:path*"],
};
