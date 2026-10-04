/**
 * Composition Root. The ONLY place where concrete infrastructure is wired
 * to application services. The UI / Server Actions import ready-to-use
 * services from here and never touch Prisma directly.
 */
import { PrismaProjectRepository } from "@/infrastructure/prisma/project.repository.prisma";
import { PrismaTaskRepository } from "@/infrastructure/prisma/task.repository.prisma";
import { PrismaDependencyRepository } from "@/infrastructure/prisma/dependency.repository.prisma";
import { PrismaUserRepository } from "@/infrastructure/prisma/user.repository.prisma";
import { ProjectService } from "@/application/project/project.service";
import { TaskService } from "@/application/task/task.service";
import { DependencyService } from "@/application/task/dependency.service";
import { UserService } from "@/application/user/user.service";

const projectRepository = new PrismaProjectRepository();
const taskRepository = new PrismaTaskRepository();
const dependencyRepository = new PrismaDependencyRepository();
const userRepository = new PrismaUserRepository();

export const dependencyService = new DependencyService(
  dependencyRepository,
  taskRepository,
);
export const projectService = new ProjectService(projectRepository);
export const taskService = new TaskService(
  taskRepository,
  projectRepository,
  dependencyService,
);
export const userService = new UserService(userRepository);
