import type {
  DependencyRepository,
  NewDependency,
} from "@/domain/task/dependency.repository";
import type {
  DependencyEdge,
  TaskDependency,
} from "@/domain/task/dependency";
import { prisma } from "./client";
import { toDependency } from "./mappers";

export class PrismaDependencyRepository implements DependencyRepository {
  async create(data: NewDependency): Promise<TaskDependency> {
    const row = await prisma.taskDependency.create({
      data: {
        predecessorId: data.predecessorId,
        successorId: data.successorId,
        type: data.type,
        lagDays: data.lagDays ?? 0,
      },
    });
    return toDependency(row);
  }

  async findById(id: string): Promise<TaskDependency | null> {
    const row = await prisma.taskDependency.findUnique({ where: { id } });
    return row ? toDependency(row) : null;
  }

  async delete(id: string): Promise<void> {
    await prisma.taskDependency.delete({ where: { id } });
  }

  async listEdges(): Promise<DependencyEdge[]> {
    const rows = await prisma.taskDependency.findMany({
      select: { predecessorId: true, successorId: true },
    });
    return rows;
  }

  async findBySuccessor(successorId: string): Promise<TaskDependency[]> {
    const rows = await prisma.taskDependency.findMany({
      where: { successorId },
    });
    return rows.map(toDependency);
  }

  async findByPredecessor(predecessorId: string): Promise<TaskDependency[]> {
    const rows = await prisma.taskDependency.findMany({
      where: { predecessorId },
    });
    return rows.map(toDependency);
  }
}
