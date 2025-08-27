import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "./app/auth";

const protectedRoutes = ["/platform", "/platform/*"];
const adminRoutes = ["/platform/admin", "/platform/admin/*"];
const unprotectedRoutes = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/error",
  "/auth/logout",
];

export default async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // check if requesting admin routes
  const isAdminRoute = adminRoutes.some(route => {
    if (route.endsWith("/*")) {
      const basePath = route.slice(0, -2);
      return pathname.startsWith(basePath);
    }
    return pathname === route;
  });

  // if accessing admin routes, check if user is admin
  if (isAdminRoute) {
    if (!session) {
      // redirect to login if not authenticated
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (!session.user?.is_admin) {
      // redirect to platform home if not admin
      return NextResponse.redirect(new URL("/platform", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
