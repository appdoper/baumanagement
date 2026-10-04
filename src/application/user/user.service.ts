import type { User, UserRole } from "@/domain/user/user.entity";
import type { UserRepository } from "@/domain/user/user.repository";
import { ValidationError } from "@/domain/shared/errors";
import { parseOrThrow } from "@/application/shared/validate";
import {
  generatePassword,
  hashPassword,
  verifyPassword,
} from "@/lib/password";
import {
  changePasswordSchema,
  createUserSchema,
  type ChangePasswordInput,
  type CreateUserInput,
} from "./user.dto";

export interface CreatedUser {
  user: User;
  /** Plaintext password — returned exactly once, only right after creation. */
  password: string;
}

export class UserService {
  constructor(private readonly users: UserRepository) {}

  /** Creates a user with a generated password and returns it once in cleartext. */
  async create(input: CreateUserInput): Promise<CreatedUser> {
    const data = parseOrThrow(createUserSchema, input, "Ungültige Benutzerdaten.");

    const existing = await this.users.findByEmail(data.email);
    if (existing) {
      throw new ValidationError(
        "Ein Benutzer mit dieser E-Mail existiert bereits.",
      );
    }

    const password = generatePassword();
    const user = await this.users.create({
      name: data.name ?? null,
      email: data.email,
      role: data.role ?? "USER",
      passwordHash: hashPassword(password),
    });

    return { user, password };
  }

  list(): Promise<User[]> {
    return this.users.findAll();
  }

  /** Returns the user if email + password match, otherwise null. */
  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const creds = await this.users.findCredentialsByEmail(email.toLowerCase());
    if (!creds) return null;
    if (!verifyPassword(password, creds.passwordHash)) return null;
    const { passwordHash: _ignored, ...user } = creds;
    return user;
  }

  /**
   * A user sets their own password. Enforces the strict policy and clears the
   * forced-change flag.
   */
  async changeOwnPassword(id: string, input: ChangePasswordInput): Promise<void> {
    const data = parseOrThrow(
      changePasswordSchema,
      input,
      "Das Passwort erfüllt die Richtlinie nicht.",
    );
    await this.users.setPassword(id, hashPassword(data.password), false);
  }

  /**
   * Admin reset: generates a temporary password (exempt from the strict policy)
   * and forces a change on next login. Returns the plaintext password once.
   */
  async resetPassword(id: string): Promise<{ password: string }> {
    const password = generatePassword();
    await this.users.setPassword(id, hashPassword(password), true);
    return { password };
  }

  async delete(id: string): Promise<void> {
    await this.users.delete(id);
  }

  /**
   * Idempotent bootstrap for the seed script. Creates the admin with a
   * generated password if the email is unused; returns null password otherwise.
   */
  async ensureAdmin(
    email: string,
    name: string,
  ): Promise<{ user: User; password: string | null }> {
    const existing = await this.users.findByEmail(email.toLowerCase());
    if (existing) return { user: existing, password: null };
    const { user, password } = await this.create({
      email,
      name,
      role: "ADMIN" satisfies UserRole,
    });
    return { user, password };
  }
}
