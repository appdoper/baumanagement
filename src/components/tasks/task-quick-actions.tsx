"use client";

import { useTransition } from "react";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Task, TaskStatus } from "@/domain/task/task.entity";
import { updateTaskStatusAction } from "@/app/actions/task.actions";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS } from "./task-status-badge";

const NEXT_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
};

export function TaskQuickActions({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const next = NEXT_STATUS[task.status];
  // BLOCKED tasks must not be moved here, otherwise a quick click could bypass
  // the dependency logic that put them into that state.
  const blocked = task.status === "BLOCKED";
  const done = task.status === "DONE";

  function setStatus(status: TaskStatus) {
    startTransition(async () => {
      const res = await updateTaskStatusAction(
        task.id,
        status,
        task.projectId,
        task.version,
      );
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending || blocked || !next}
        onClick={() => next && setStatus(next)}
        aria-label="Vorgang weiterschieben"
        title={next ? `Weiter zu „${STATUS_LABELS[next]}“` : "Kein nächster Schritt"}
      >
        <ChevronRight className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400"
        disabled={isPending || blocked || done}
        onClick={() => setStatus("DONE")}
        aria-label="Vorgang als erledigt markieren"
        title="Als erledigt markieren"
      >
        <Check className="size-4" />
      </Button>
    </div>
  );
}
