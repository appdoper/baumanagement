import { Prisma } from "@prisma/client";
import type {
  Repositories,
  TransactionOptions,
  UnitOfWork,
} from "@/application/shared/unit-of-work";
import { prisma } from "./client";
import { PrismaTaskRepository } from "./task.repository.prisma";
import { PrismaDependencyRepository } from "./dependency.repository.prisma";
import { PrismaProjectRepository } from "./project.repository.prisma";

const ISOLATION: Record<
  NonNullable<TransactionOptions["isolationLevel"]>,
  Prisma.TransactionIsolationLevel
> = {
  ReadCommitted: Prisma.TransactionIsolationLevel.ReadCommitted,
  RepeatableRead: Prisma.TransactionIsolationLevel.RepeatableRead,
  Serializable: Prisma.TransactionIsolationLevel.Serializable,
};

export class PrismaUnitOfWork implements UnitOfWork {
  run<T>(
    work: (repos: Repositories) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T> {
    return prisma.$transaction(
      (tx) =>
        work({
          tasks: new PrismaTaskRepository(tx),
          dependencies: new PrismaDependencyRepository(tx),
          projects: new PrismaProjectRepository(tx),
        }),
      options?.isolationLevel
        ? { isolationLevel: ISOLATION[options.isolationLevel] }
        : undefined,
    );
  }
}
