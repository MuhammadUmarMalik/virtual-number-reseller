import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.cookies.has("nr_access")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/buy-number/:path*",
    "/my-numbers/:path*",
    "/orders/:path*",
    "/wallet/:path*",
    "/transactions/:path*",
    "/profile/:path*",
    "/support/:path*",
    "/admin/:path*"
  ]
};
