import type { Task } from "@/domain/task/task.entity";
import type {
  TaskFilter,
  TaskRepository,
} from "@/domain/task/task.repository";
import type { ProjectRepository } from "@/domain/project/project.repository";
import { NotFoundError } from "@/domain/shared/errors";
import { parseOrThrow } from "@/application/shared/validate";
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "./task.dto";

export class TaskService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async create(input: CreateTaskInput): Promise<Task> {
    const data = parseOrThrow(createTaskSchema, input, "Ungültige Vorgangsdaten.");
    await this.assertProjectExists(data.projectId);
    return this.tasks.create(data);
  }

  async getById(id: string): Promise<Task> {
    const task = await this.tasks.findById(id);
    if (!task) throw new NotFoundError("Task", id);
    return task;
  }

  list(filter?: TaskFilter): Promise<Task[]> {
    return this.tasks.findAll(filter);
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const data = parseOrThrow(updateTaskSchema, input, "Ungültige Vorgangsdaten.");
    await this.assertExists(id);
    if (data.projectId) await this.assertProjectExists(data.projectId);
    return this.tasks.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.assertExists(id);
    await this.tasks.delete(id);
  }

  private async assertExists(id: string): Promise<void> {
    const found = await this.tasks.findById(id);
    if (!found) throw new NotFoundError("Task", id);
  }

  private async assertProjectExists(projectId: string): Promise<void> {
    const found = await this.projects.findById(projectId);
    if (!found) throw new NotFoundError("Project", projectId);
  }
}
