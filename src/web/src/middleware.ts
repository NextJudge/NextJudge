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

const isAdminRoute = (pathname: string): boolean =>
  adminRoutes.some((route) => {
    if (route.endsWith("/*")) {
      const basePath = route.slice(0, -2);
      return pathname.startsWith(basePath);
    }
    return pathname === route;
  });

const isUnprotectedRoute = (pathname: string): boolean =>
  unprotectedRoutes.some((route) => {
    if (route.endsWith("/*")) {
      const basePath = route.slice(0, -2);
      return pathname.startsWith(basePath);
    }
    return pathname === route;
  });

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (isUnprotectedRoute(pathname)) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  }

  const session = request.auth;

  if (pathname.startsWith("/platform") && !session) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (session && isAdminRoute(pathname) && !session.user?.is_admin) {
    return NextResponse.redirect(new URL("/platform", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
