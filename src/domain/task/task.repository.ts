import type { Task, TaskPerson, TaskStatus } from "./task.entity";

export interface NewTask {
  title: string;
  description?: string | null;
  procurementSource?: string | null;
  person?: TaskPerson | null;
  status?: TaskStatus;
  estimatedCostCents?: number | null;
  currency?: string;
  plannedStart?: Date | null;
  plannedEnd?: Date | null;
  deadline?: Date | null;
  actualStart?: Date | null;
  actualEnd?: Date | null;
  projectId: string;
  locationId?: string | null;
}

export interface TaskPatch {
  title?: string;
  description?: string | null;
  procurementSource?: string | null;
  person?: TaskPerson | null;
  status?: TaskStatus;
  estimatedCostCents?: number | null;
  currency?: string;
  plannedStart?: Date | null;
  plannedEnd?: Date | null;
  deadline?: Date | null;
  actualStart?: Date | null;
  actualEnd?: Date | null;
  projectId?: string;
  locationId?: string | null;
}

export interface TaskFilter {
  projectId?: string;
  status?: TaskStatus;
}

/**
 * Port (domain boundary). Infrastructure provides the Prisma implementation.
 */
export interface TaskRepository {
  create(data: NewTask): Promise<Task>;
  /** Only live (not soft-deleted) tasks are returned. */
  findById(id: string): Promise<Task | null>;
  findAll(filter?: TaskFilter): Promise<Task[]>;
  /** System update: bumps the version, no concurrency check. */
  update(id: string, data: TaskPatch): Promise<Task>;
  /**
   * Optimistic-concurrency update: only writes if the stored version still
   * equals `expectedVersion` (then bumps it). Returns null on a mismatch.
   */
  updateWithVersion(
    id: string,
    expectedVersion: number,
    data: TaskPatch,
  ): Promise<Task | null>;
  /** Soft delete: marks the task as deleted instead of removing the row. */
  softDelete(id: string): Promise<void>;
  /** Soft delete every live task belonging to any of the given projects. */
  softDeleteByProjects(projectIds: readonly string[]): Promise<void>;
}
