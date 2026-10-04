import type { Task, TaskStatus } from "./task.entity";

export interface NewTask {
  title: string;
  description?: string | null;
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
  findById(id: string): Promise<Task | null>;
  findAll(filter?: TaskFilter): Promise<Task[]>;
  update(id: string, data: TaskPatch): Promise<Task>;
  delete(id: string): Promise<void>;
}
