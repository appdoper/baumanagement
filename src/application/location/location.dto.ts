import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().trim().min(1, "Name darf nicht leer sein.").max(100),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
