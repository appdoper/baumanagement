/**
 * Composition Root. The ONLY place where concrete infrastructure is wired
 * to application services. The UI / Server Actions import ready-to-use
 * services from here and never touch Prisma directly.
 */
import { PrismaProjectRepository } from "@/infrastructure/prisma/project.repository.prisma";
import { PrismaTaskRepository } from "@/infrastructure/prisma/task.repository.prisma";
import { PrismaAttachmentRepository } from "@/infrastructure/prisma/attachment.repository.prisma";
import { PrismaLocationRepository } from "@/infrastructure/prisma/location.repository.prisma";
import { PrismaDependencyRepository } from "@/infrastructure/prisma/dependency.repository.prisma";
import { PrismaUserRepository } from "@/infrastructure/prisma/user.repository.prisma";
import { PrismaUnitOfWork } from "@/infrastructure/prisma/unit-of-work.prisma";
import { ProjectService } from "@/application/project/project.service";
import { TaskService } from "@/application/task/task.service";
import { AttachmentService } from "@/application/task/attachment.service";
import { LocationService } from "@/application/location/location.service";
import { DependencyService } from "@/application/task/dependency.service";
import { UserService } from "@/application/user/user.service";

const projectRepository = new PrismaProjectRepository();
const taskRepository = new PrismaTaskRepository();
const attachmentRepository = new PrismaAttachmentRepository();
const locationRepository = new PrismaLocationRepository();
const dependencyRepository = new PrismaDependencyRepository();
const userRepository = new PrismaUserRepository();

// Shared transaction boundary for all multi-repository writes.
const unitOfWork = new PrismaUnitOfWork();

export const dependencyService = new DependencyService(
  unitOfWork,
  dependencyRepository,
  taskRepository,
);
export const projectService = new ProjectService(unitOfWork, projectRepository);
export const taskService = new TaskService(
  unitOfWork,
  taskRepository,
  projectRepository,
  dependencyService,
);
export const attachmentService = new AttachmentService(
  attachmentRepository,
  taskRepository,
);
export const locationService = new LocationService(locationRepository);
export const userService = new UserService(userRepository);
