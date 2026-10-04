import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name darf nicht leer sein.").max(200),
  description: z.string().trim().max(5000).nullish(),
  parentId: z.string().cuid().nullish(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
