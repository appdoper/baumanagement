import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Edge-safe Auth.js config shared between the proxy (route protection) and the
 * full server-side setup in `auth.ts`. It must NOT import Prisma or the
 * CredentialsProvider's `authorize` (those run server-side only).
 */
export const authConfig = {
  // Self-hosted app behind its own reverse proxy: trust the deployment host
  // instead of pinning AUTH_URL. Without this, production (`next start`) throws
  // UntrustedHost; `next dev` trusts localhost automatically.
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    // Pure (no Prisma) callbacks live here so the edge-safe proxy also runs
    // them — the proxy relies on `requiresPasswordChange` being on the session.
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.requiresPasswordChange = user.requiresPasswordChange;
      }
      // `unstable_update({ user: { requiresPasswordChange } })` from the
      // change-password action lands here so the JWT reflects the new state.
      if (
        trigger === "update" &&
        typeof session?.user?.requiresPasswordChange === "boolean"
      ) {
        token.requiresPasswordChange = session.user.requiresPasswordChange;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        session.user.role = token.role;
        session.user.requiresPasswordChange = token.requiresPasswordChange;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;
      const isOnLogin = pathname === "/login";
      const isOnChangePassword = pathname === "/change-password";

      if (!isLoggedIn) {
        // Only the login page is reachable without a session.
        return isOnLogin;
      }

      // Logged in but still owes a password change: lock them to that page.
      // NextResponse.redirect (not plain Response.redirect) so RSC/Server-Action
      // navigations get the redirect Next.js expects, not a raw 302.
      if (auth!.user.requiresPasswordChange) {
        return (
          isOnChangePassword ||
          NextResponse.redirect(new URL("/change-password", request.nextUrl))
        );
      }

      // Password is fine: keep them off login / change-password.
      if (isOnLogin || isOnChangePassword) {
        return NextResponse.redirect(new URL("/", request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
