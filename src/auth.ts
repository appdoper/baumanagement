import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/infrastructure/prisma/client";
import { userService } from "@/container";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";
        if (!email || !password) return null;

        const user = await userService.verifyCredentials(email, password);
        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          requiresPasswordChange: user.requiresPasswordChange,
        };
      },
    }),
  ],
  // jwt/session/authorized callbacks are defined in authConfig (edge-safe) and
  // come in via the spread above — the proxy needs them too.
});
