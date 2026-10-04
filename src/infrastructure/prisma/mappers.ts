import type {
  Project as PrismaProject,
  Task as PrismaTask,
  TaskDependency as PrismaTaskDependency,
  User as PrismaUser,
} from "@prisma/client";
import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";
import type { TaskDependency } from "@/domain/task/dependency";
import type { User } from "@/domain/user/user.entity";

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

export function toUser(row: PrismaUser): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    role: row.role,
    requiresPasswordChange: row.requiresPasswordChange,
    createdAt: row.createdAt,
  };
}

export function toDependency(row: PrismaTaskDependency): TaskDependency {
  return {
    id: row.id,
    type: row.type,
    lagDays: row.lagDays,
    predecessorId: row.predecessorId,
    successorId: row.successorId,
    createdAt: row.createdAt,
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
