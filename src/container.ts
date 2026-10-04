/**
 * Composition Root. The ONLY place where concrete infrastructure is wired
 * to application services. The UI / Server Actions import ready-to-use
 * services from here and never touch Prisma directly.
 */
import { PrismaProjectRepository } from "@/infrastructure/prisma/project.repository.prisma";
import { PrismaTaskRepository } from "@/infrastructure/prisma/task.repository.prisma";
import { ProjectService } from "@/application/project/project.service";
import { TaskService } from "@/application/task/task.service";

const projectRepository = new PrismaProjectRepository();
const taskRepository = new PrismaTaskRepository();

export const projectService = new ProjectService(projectRepository);
export const taskService = new TaskService(taskRepository, projectRepository);
