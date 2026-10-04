export const USER_ROLES = ["ADMIN", "USER"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  requiresPasswordChange: boolean;
  createdAt: Date;
}
