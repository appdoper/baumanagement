import type { Project } from "./project.entity";

export interface ProjectMetrics {
  /** Count of tasks whose status is not DONE. */
  openTaskCount: number;
  /** Sum of estimatedCostCents across all tasks (nulls treated as 0). */
  totalCostCents: number;
}

export interface ProjectWithMetrics extends Project {
  metrics: ProjectMetrics;
}

export interface NewProject {
  name: string;
  description?: string | null;
  parentId?: string | null;
}

export interface ProjectPatch {
  name?: string;
  description?: string | null;
  parentId?: string | null;
}

/**
 * Port (domain boundary). Infrastructure provides the Prisma implementation.
 */
export interface ProjectRepository {
  create(data: NewProject): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  findAllWithMetrics(): Promise<ProjectWithMetrics[]>;
  findChildren(parentId: string | null): Promise<Project[]>;
  update(id: string, data: ProjectPatch): Promise<Project>;
  delete(id: string): Promise<void>;
}
