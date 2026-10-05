import type { Task } from "@/domain/task/task.entity";
import type {
  TaskFilter,
  TaskRepository,
} from "@/domain/task/task.repository";
import type { ProjectRepository } from "@/domain/project/project.repository";
import { ConflictError, NotFoundError } from "@/domain/shared/errors";
import { parseOrThrow } from "@/application/shared/validate";
import type { UnitOfWork } from "@/application/shared/unit-of-work";
import type { DependencyService } from "./dependency.service";
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "./task.dto";

export class TaskService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
    private readonly dependencies: DependencyService,
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

  /**
   * Updates a task and, in the SAME transaction, propagates any status change
   * to its dependency successors (block / unblock). If `version` is provided it
   * is enforced with optimistic concurrency — a stale version aborts the whole
   * transaction with a ConflictError, so nothing is half-applied.
   */
  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const data = parseOrThrow(updateTaskSchema, input, "Ungültige Vorgangsdaten.");
    const { version, ...patch } = data;
    if (patch.projectId) await this.assertProjectExists(patch.projectId);

    return this.uow.run(async (repos) => {
      const existing = await repos.tasks.findById(id);
      if (!existing) throw new NotFoundError("Task", id);

      const updated =
        version != null
          ? await repos.tasks.updateWithVersion(id, version, patch)
          : await repos.tasks.update(id, patch);

      // null = the version in the DB no longer matches what the client read.
      if (!updated) throw new ConflictError();

      if (updated.status === "DONE" && existing.status !== "DONE") {
        await this.dependencies.syncAfterCompletion(updated.id, repos);
      } else if (existing.status === "DONE" && updated.status !== "DONE") {
        await this.dependencies.syncAfterReopen(updated.id, repos);
      }
      return updated;
    });
  }

  /**
   * Soft-deletes a task and, atomically, frees successors it was blocking
   * (a removed blocker may satisfy a Finish-to-Start constraint).
   */
  async delete(id: string): Promise<void> {
    await this.assertExists(id);
    await this.uow.run(async (repos) => {
      const successors = await repos.dependencies.findByPredecessor(id);
      await repos.tasks.softDelete(id);
      for (const dep of successors) {
        await this.dependencies.unblockIfSatisfied(dep.successorId, repos);
      }
    });
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
