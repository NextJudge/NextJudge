import { auth } from "@/app/auth";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedRoutes = ["/platform", "/platform/*"];
const unprotectedRoutes = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/error",
  "/auth/logout",
];

export default async function middleware(request: NextRequest) {
  const session = await auth();

  const isProtectedRoute = protectedRoutes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (request.nextUrl.pathname === "/auth/logout") {
    return;
  }

  if (!session && isProtectedRoute) {
    const absoluteURL = new URL("/", request.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }
  if (session && unprotectedRoutes.includes(request.nextUrl.pathname)) {
    const absoluteURL = new URL("/platform", request.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
