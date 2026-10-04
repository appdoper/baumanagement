import type {
  NewUser,
  UserCredentials,
  UserRepository,
} from "@/domain/user/user.repository";
import type { User } from "@/domain/user/user.entity";
import { prisma } from "./client";
import { toUser } from "./mappers";

export class PrismaUserRepository implements UserRepository {
  async create(data: NewUser): Promise<User> {
    const row = await prisma.user.create({
      data: {
        name: data.name ?? null,
        email: data.email,
        role: data.role ?? "USER",
        passwordHash: data.passwordHash,
      },
    });
    return toUser(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? toUser(row) : null;
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    if (!row || !row.passwordHash) return null;
    return { ...toUser(row), passwordHash: row.passwordHash };
  }

  async findAll(): Promise<User[]> {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toUser);
  }

  async setPassword(
    id: string,
    passwordHash: string,
    requiresPasswordChange: boolean,
  ): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { passwordHash, requiresPasswordChange },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}
