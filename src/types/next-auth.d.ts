import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/domain/user/user.entity";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      requiresPasswordChange: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    requiresPasswordChange: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: UserRole;
    requiresPasswordChange: boolean;
  }
}
