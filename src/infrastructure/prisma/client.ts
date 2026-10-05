import { PrismaClient, type Prisma } from "@prisma/client";

/**
 * Either the root client or an interactive-transaction client. Repositories
 * accept this so the same code runs standalone or inside a `$transaction`.
 */
export type Db = PrismaClient | Prisma.TransactionClient;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
