"use client";

import { Check, CircleAlert, Loader2 } from "lucide-react";

/** Idle time after the last change before an auto-save fires. */
export const AUTOSAVE_DELAY_MS = 700;

export type SaveState = "idle" | "saving" | "saved" | "error";

/** Footer indicator that replaces a save button for auto-saving forms. */
export function AutoSaveStatus({
  state,
  error,
}: {
  state: SaveState;
  error: string | null;
}) {
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Speichert…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Check className="size-3.5 text-green-600 dark:text-green-400" />
        Automatisch gespeichert
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-destructive">
        <CircleAlert className="size-3.5" />
        {error ?? "Nicht gespeichert"}
      </span>
    );
  }
  return (
    <span className="text-sm text-muted-foreground">
      Änderungen werden automatisch gespeichert
    </span>
  );
}
