import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "./app/auth";

const adminRoutes = ["/platform/admin", "/platform/admin/*"];
const unprotectedRoutes = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/error",
  "/auth/logout",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isUnprotected = unprotectedRoutes.some(route => {
    if (route.endsWith("/*")) {
      const basePath = route.slice(0, -2);
      return pathname.startsWith(basePath);
    }
    return pathname === route;
  });

  if (isUnprotected) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  }

  const session = await auth();

  if (pathname.startsWith("/platform") && !session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isAdminRoute = adminRoutes.some(route => {
    if (route.endsWith("/*")) {
      const basePath = route.slice(0, -2);
      return pathname.startsWith(basePath);
    }
    return pathname === route;
  });

  if (session && isAdminRoute && !session.user?.is_admin) {
    return NextResponse.redirect(new URL("/platform", request.url));
  }

  if (isAdminRoute && !session?.user?.is_admin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
