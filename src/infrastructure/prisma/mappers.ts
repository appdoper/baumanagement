import type {
  Project as PrismaProject,
  Task as PrismaTask,
} from "@prisma/client";
import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";

// Prisma enum string values are identical to the domain union values,
// so mapping is a straight pass-through (typed, not cast blindly).
export function toProject(row: PrismaProject): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    parentId: row.parentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toTask(row: PrismaTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    estimatedCostCents: row.estimatedCostCents,
    currency: row.currency,
    plannedStart: row.plannedStart,
    plannedEnd: row.plannedEnd,
    deadline: row.deadline,
    actualStart: row.actualStart,
    actualEnd: row.actualEnd,
    projectId: row.projectId,
    locationId: row.locationId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
