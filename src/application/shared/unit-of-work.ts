import type { TaskRepository } from "@/domain/task/task.repository";
import type { DependencyRepository } from "@/domain/task/dependency.repository";
import type { ProjectRepository } from "@/domain/project/project.repository";

/**
 * The set of repositories bound to a single transaction. Services receive this
 * inside `UnitOfWork.run` and use it for all writes that must be atomic.
 */
export interface Repositories {
  tasks: TaskRepository;
  dependencies: DependencyRepository;
  projects: ProjectRepository;
}

export interface TransactionOptions {
  /** Postgres isolation level. Use "Serializable" where a read-then-write
   * invariant (e.g. the dependency cycle check) must not be interleaved. */
  isolationLevel?: "ReadCommitted" | "RepeatableRead" | "Serializable";
}

/**
 * Port (domain boundary) for atomic, multi-repository work. Infrastructure
 * provides a Prisma-backed implementation (`$transaction`). Everything in the
 * callback commits together or rolls back together.
 */
export interface UnitOfWork {
  run<T>(
    work: (repos: Repositories) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T>;
}
