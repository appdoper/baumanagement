import type { Project } from "@/domain/project/project.entity";
import type { ProjectRepository } from "@/domain/project/project.repository";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import { parseOrThrow } from "@/application/shared/validate";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "./project.dto";

export class ProjectService {
  constructor(private readonly projects: ProjectRepository) {}

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

  async delete(id: string): Promise<void> {
    await this.assertExists(id);
    await this.projects.delete(id);
  }

  private async assertExists(id: string): Promise<void> {
    const found = await this.projects.findById(id);
    if (!found) throw new NotFoundError("Project", id);
  }
}
