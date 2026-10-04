import type { ZodType } from "zod";
import { ValidationError } from "@/domain/shared/errors";

export function parseOrThrow<T>(
  schema: ZodType<T>,
  input: unknown,
  message = "Ungültige Eingabedaten.",
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(message, result.error.flatten());
  }
  return result.data;
}
