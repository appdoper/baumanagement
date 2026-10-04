import type { Project } from "./project.entity";

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
  findChildren(parentId: string | null): Promise<Project[]>;
  update(id: string, data: ProjectPatch): Promise<Project>;
  delete(id: string): Promise<void>;
}
