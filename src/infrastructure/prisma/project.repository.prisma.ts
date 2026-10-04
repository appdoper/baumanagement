import type {
  NewProject,
  ProjectPatch,
  ProjectRepository,
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
