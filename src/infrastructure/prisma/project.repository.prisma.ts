import type {
  NewProject,
  ProjectPatch,
  ProjectRepository,
  ProjectWithMetrics,
} from "@/domain/project/project.repository";
import type { Project } from "@/domain/project/project.entity";
import { prisma } from "./client";
import { toProject } from "./mappers";

export class PrismaProjectRepository implements ProjectRepository {
  async create(data: NewProject): Promise<Project> {
    const row = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        parentId: data.parentId ?? null,
      },
    });
    return toProject(row);
  }

  async findById(id: string): Promise<Project | null> {
    const row = await prisma.project.findUnique({ where: { id } });
    return row ? toProject(row) : null;
  }

  async findAll(): Promise<Project[]> {
    const rows = await prisma.project.findMany({
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toProject);
  }

  async findAllWithMetrics(): Promise<ProjectWithMetrics[]> {
    // Two grouped aggregations instead of loading every task: total cost over
    // all tasks, open count only for unfinished ones.
    const [rows, costByProject, openByProject] = await Promise.all([
      prisma.project.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.task.groupBy({
        by: ["projectId"],
        _sum: { estimatedCostCents: true },
      }),
      prisma.task.groupBy({
        by: ["projectId"],
        where: { status: { not: "DONE" } },
        _count: { _all: true },
      }),
    ]);

    const costMap = new Map(
      costByProject.map((g) => [g.projectId, g._sum.estimatedCostCents ?? 0]),
    );
    const openMap = new Map(
      openByProject.map((g) => [g.projectId, g._count._all]),
    );

    return rows.map((row) => ({
      ...toProject(row),
      metrics: {
        totalCostCents: costMap.get(row.id) ?? 0,
        openTaskCount: openMap.get(row.id) ?? 0,
      },
    }));
  }

  async findChildren(parentId: string | null): Promise<Project[]> {
    const rows = await prisma.project.findMany({
      where: { parentId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toProject);
  }

  async update(id: string, data: ProjectPatch): Promise<Project> {
    const row = await prisma.project.update({
      where: { id },
      data,
    });
    return toProject(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.project.delete({ where: { id } });
  }
}
