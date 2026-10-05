import type {
  DependencyRepository,
  NewDependency,
} from "@/domain/task/dependency.repository";
import type {
  DependencyEdge,
  TaskDependency,
} from "@/domain/task/dependency";
import { prisma, type Db } from "./client";
import { toDependency } from "./mappers";

export class PrismaDependencyRepository implements DependencyRepository {
  constructor(private readonly db: Db = prisma) {}

  async create(data: NewDependency): Promise<TaskDependency> {
    const row = await this.db.taskDependency.create({
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
    const row = await this.db.taskDependency.findUnique({ where: { id } });
    return row ? toDependency(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.db.taskDependency.delete({ where: { id } });
  }

  async listEdges(): Promise<DependencyEdge[]> {
    const rows = await this.db.taskDependency.findMany({
      select: { predecessorId: true, successorId: true },
    });
    return rows;
  }

  async findBySuccessor(successorId: string): Promise<TaskDependency[]> {
    const rows = await this.db.taskDependency.findMany({
      where: { successorId },
    });
    return rows.map(toDependency);
  }

  async findByPredecessor(predecessorId: string): Promise<TaskDependency[]> {
    const rows = await this.db.taskDependency.findMany({
      where: { predecessorId },
    });
    return rows.map(toDependency);
  }
}
