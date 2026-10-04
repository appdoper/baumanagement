import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16 renamed the `middleware` file convention to `proxy`. The exported
// function (here the Auth.js handler) still runs before every matched route.
// Uses only the edge-safe `authConfig` — route protection happens in the
// `authorized` callback, so Prisma never gets pulled into the proxy.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Protect everything except Next internals, the auth API, and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
