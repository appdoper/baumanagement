import type { User, UserRole } from "./user.entity";

export interface NewUser {
  name?: string | null;
  email: string;
  role?: UserRole;
  passwordHash: string;
}

/** Internal read model for authentication — never leaves the application layer. */
export interface UserCredentials extends User {
  passwordHash: string;
}

/**
 * Port (domain boundary). Infrastructure provides the Prisma implementation.
 */
export interface UserRepository {
  create(data: NewUser): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  findAll(): Promise<User[]>;
  setPassword(
    id: string,
    passwordHash: string,
    requiresPasswordChange: boolean,
  ): Promise<void>;
  delete(id: string): Promise<void>;
}
