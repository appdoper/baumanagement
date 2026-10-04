import { z } from "zod";
import { SUPPORTED_DEPENDENCY_TYPES } from "@/domain/task/dependency";

export const addDependencySchema = z
  .object({
    predecessorId: z.string().cuid(),
    successorId: z.string().cuid(),
    type: z.enum(SUPPORTED_DEPENDENCY_TYPES).default("FINISH_TO_START"),
    lagDays: z.number().int().optional(),
  })
  .refine((d) => d.predecessorId !== d.successorId, {
    message: "Ein Vorgang kann nicht von sich selbst abhängen.",
    path: ["predecessorId"],
  });

export type AddDependencyInput = z.infer<typeof addDependencySchema>;
