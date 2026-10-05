import { z } from "zod";
import { TASK_PERSONS, TASK_STATUSES } from "@/domain/task/task.entity";

const dateish = z.coerce.date();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Titel darf nicht leer sein.").max(200),
  description: z.string().trim().max(10000).nullish(),
  procurementSource: z.string().trim().max(500).nullish(),
  person: z.enum(TASK_PERSONS).nullish(),
  status: z.enum(TASK_STATUSES).optional(),
  estimatedCostCents: z.number().int().nonnegative().nullish(),
  currency: z.string().trim().length(3).optional(),
  plannedStart: dateish.nullish(),
  plannedEnd: dateish.nullish(),
  deadline: dateish.nullish(),
  actualStart: dateish.nullish(),
  actualEnd: dateish.nullish(),
  projectId: z.string().cuid(),
  locationId: z.string().cuid().nullish(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  // Optimistic-concurrency token the client read; checked on write.
  version: z.number().int().positive().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
