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
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
