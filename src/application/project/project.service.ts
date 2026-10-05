import type { Project } from "@/domain/project/project.entity";
import type {
  ProjectRepository,
  ProjectWithMetrics,
} from "@/domain/project/project.repository";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import { parseOrThrow } from "@/application/shared/validate";
import type { Repositories, UnitOfWork } from "@/application/shared/unit-of-work";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "./project.dto";

export class ProjectService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly projects: ProjectRepository,
  ) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const data = parseOrThrow(createProjectSchema, input, "Ungültige Projektdaten.");
    if (data.parentId) await this.assertExists(data.parentId);
    return this.projects.create(data);
  }

  async getById(id: string): Promise<Project> {
    const project = await this.projects.findById(id);
    if (!project) throw new NotFoundError("Project", id);
    return project;
  }

  list(): Promise<Project[]> {
    return this.projects.findAll();
  }

  listWithMetrics(): Promise<ProjectWithMetrics[]> {
    return this.projects.findAllWithMetrics();
  }

  listChildren(parentId: string | null): Promise<Project[]> {
    return this.projects.findChildren(parentId);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const data = parseOrThrow(updateProjectSchema, input, "Ungültige Projektdaten.");
    await this.assertExists(id);

    if (data.parentId) {
      if (data.parentId === id) {
        throw new ValidationError(
          "Ein Projekt kann nicht sein eigenes Unterprojekt sein.",
        );
      }
      await this.assertExists(data.parentId);
    }

    return this.projects.update(id, data);
  }

  /**
   * Soft-deletes a project and, atomically, its whole subtree (descendant
   * projects and all their tasks). Replaces the dangerous physical cascade —
   * nothing is removed, only flagged, so an accidental delete is recoverable.
   */
  async delete(id: string): Promise<void> {
    await this.assertExists(id);
    await this.uow.run(async (repos) => {
      const ids = await this.collectSubtreeIds(repos, id);
      await repos.projects.softDeleteMany(ids);
      await repos.tasks.softDeleteByProjects(ids);
    });
  }

  /** Breadth-first collection of a project id plus all live descendant ids. */
  private async collectSubtreeIds(
    repos: Repositories,
    rootId: string,
  ): Promise<string[]> {
    const ids = [rootId];
    let frontier = [rootId];
    while (frontier.length > 0) {
      // Sequential: concurrent queries on one interactive-transaction client
      // are not safe, so traverse the frontier one parent at a time.
      const childIds: string[] = [];
      for (const pid of frontier) {
        const children = await repos.projects.findChildren(pid);
        childIds.push(...children.map((c) => c.id));
      }
      if (childIds.length === 0) break;
      ids.push(...childIds);
      frontier = childIds;
    }
    return ids;
  }

  private async assertExists(id: string): Promise<void> {
    const found = await this.projects.findById(id);
    if (!found) throw new NotFoundError("Project", id);
  }
}
