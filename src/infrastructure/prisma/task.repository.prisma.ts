import type {
  NewTask,
  TaskFilter,
  TaskPatch,
  TaskRepository,
} from "@/domain/task/task.repository";
import type { Task } from "@/domain/task/task.entity";
import { prisma, type Db } from "./client";
import { toTask } from "./mappers";

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly db: Db = prisma) {}

  async create(data: NewTask): Promise<Task> {
    const row = await this.db.task.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        procurementSource: data.procurementSource ?? null,
        person: data.person ?? null,
        status: data.status ?? "TODO",
        estimatedCostCents: data.estimatedCostCents ?? null,
        currency: data.currency ?? "EUR",
        plannedStart: data.plannedStart ?? null,
        plannedEnd: data.plannedEnd ?? null,
        deadline: data.deadline ?? null,
        actualStart: data.actualStart ?? null,
        actualEnd: data.actualEnd ?? null,
        completedAt: data.completedAt ?? null,
        projectId: data.projectId,
        locationId: data.locationId ?? null,
      },
    });
    return toTask(row);
  }

  async findById(id: string): Promise<Task | null> {
    const row = await this.db.task.findFirst({ where: { id, deletedAt: null } });
    return row ? toTask(row) : null;
  }

  async findAll(filter?: TaskFilter): Promise<Task[]> {
    const rows = await this.db.task.findMany({
      where: {
        projectId: filter?.projectId,
        status: filter?.status,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toTask);
  }

  async update(id: string, data: TaskPatch): Promise<Task> {
    const row = await this.db.task.update({
      where: { id },
      data: { ...data, version: { increment: 1 } },
    });
    return toTask(row);
  }

  async updateWithVersion(
    id: string,
    expectedVersion: number,
    data: TaskPatch,
  ): Promise<Task | null> {
    // Atomic compare-and-set: writes only if the version still matches.
    const res = await this.db.task.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    if (res.count === 0) return null;
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.db.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteByProjects(projectIds: readonly string[]): Promise<void> {
    await this.db.task.updateMany({
      where: { projectId: { in: [...projectIds] }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
