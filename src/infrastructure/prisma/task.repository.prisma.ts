import type {
  NewTask,
  TaskFilter,
  TaskPatch,
  TaskRepository,
} from "@/domain/task/task.repository";
import type { Task } from "@/domain/task/task.entity";
import { prisma } from "./client";
import { toTask } from "./mappers";

export class PrismaTaskRepository implements TaskRepository {
  async create(data: NewTask): Promise<Task> {
    const row = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? "TODO",
        estimatedCostCents: data.estimatedCostCents ?? null,
        currency: data.currency ?? "EUR",
        plannedStart: data.plannedStart ?? null,
        plannedEnd: data.plannedEnd ?? null,
        deadline: data.deadline ?? null,
        actualStart: data.actualStart ?? null,
        actualEnd: data.actualEnd ?? null,
        projectId: data.projectId,
        locationId: data.locationId ?? null,
      },
    });
    return toTask(row);
  }

  async findById(id: string): Promise<Task | null> {
    const row = await prisma.task.findUnique({ where: { id } });
    return row ? toTask(row) : null;
  }

  async findAll(filter?: TaskFilter): Promise<Task[]> {
    const rows = await prisma.task.findMany({
      where: {
        projectId: filter?.projectId,
        status: filter?.status,
      },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toTask);
  }

  async update(id: string, data: TaskPatch): Promise<Task> {
    const row = await prisma.task.update({
      where: { id },
      data,
    });
    return toTask(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }
}
