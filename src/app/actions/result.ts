import { DomainError, ValidationError } from "@/domain/shared/errors";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function toActionError(e: unknown): { ok: false; error: string } {
  if (e instanceof ValidationError || e instanceof DomainError) {
    return { ok: false, error: e.message };
  }
  console.error("Unerwarteter Fehler in Server Action:", e);
  return { ok: false, error: "Ein unerwarteter Fehler ist aufgetreten." };
}
