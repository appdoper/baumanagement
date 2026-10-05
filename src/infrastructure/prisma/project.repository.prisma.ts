import type {
  NewProject,
  ProjectPatch,
  ProjectRepository,
  ProjectWithMetrics,
} from "@/domain/project/project.repository";
import type { Project } from "@/domain/project/project.entity";
import { prisma, type Db } from "./client";
import { toProject } from "./mappers";

// Load just the location ids for the many-to-many Standort tags.
const PROJECT_INCLUDE = { locations: { select: { id: true } } } as const;

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly db: Db = prisma) {}

  async create(data: NewProject): Promise<Project> {
    const row = await this.db.project.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        parentId: data.parentId ?? null,
        ...(data.locationIds && data.locationIds.length > 0
          ? { locations: { connect: data.locationIds.map((id) => ({ id })) } }
          : {}),
      },
      include: PROJECT_INCLUDE,
    });
    return toProject(row);
  }

  async findById(id: string): Promise<Project | null> {
    const row = await this.db.project.findFirst({
      where: { id, deletedAt: null },
      include: PROJECT_INCLUDE,
    });
    return row ? toProject(row) : null;
  }

  async findAll(): Promise<Project[]> {
    const rows = await this.db.project.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: PROJECT_INCLUDE,
    });
    return rows.map(toProject);
  }

  async findAllWithMetrics(): Promise<ProjectWithMetrics[]> {
    // Two grouped aggregations instead of loading every task: total cost over
    // all tasks, open count only for unfinished ones.
    const [rows, costByProject, openByProject] = await Promise.all([
      this.db.project.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: PROJECT_INCLUDE,
      }),
      this.db.task.groupBy({
        by: ["projectId"],
        where: { deletedAt: null },
        _sum: { estimatedCostCents: true },
      }),
      this.db.task.groupBy({
        by: ["projectId"],
        where: { status: { not: "DONE" }, deletedAt: null },
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
    const rows = await this.db.project.findMany({
      where: { parentId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: PROJECT_INCLUDE,
    });
    return rows.map(toProject);
  }

  async update(id: string, data: ProjectPatch): Promise<Project> {
    const { locationIds, ...rest } = data;
    const row = await this.db.project.update({
      where: { id },
      data: {
        ...rest,
        ...(locationIds !== undefined
          ? { locations: { set: locationIds.map((lid) => ({ id: lid })) } }
          : {}),
      },
      include: PROJECT_INCLUDE,
    });
    return toProject(row);
  }

  async softDeleteMany(ids: readonly string[]): Promise<void> {
    await this.db.project.updateMany({
      where: { id: { in: [...ids] }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
