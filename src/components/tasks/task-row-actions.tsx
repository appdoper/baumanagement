"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteTaskDialog } from "./delete-task-dialog";

/**
 * Per-row delete action. Editing is opened by clicking the row/card itself
 * (see TaskTable / TaskCard), so this only carries the delete affordance.
 */
export function TaskRowActions({
  taskId,
  projectId,
  taskTitle,
}: {
  taskId: string;
  projectId: string;
  taskTitle: string;
}) {
  return (
    <DeleteTaskDialog
      taskId={taskId}
      projectId={projectId}
      taskTitle={taskTitle}
      trigger={
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          aria-label="Vorgang löschen"
        >
          <Trash2 className="size-4" />
        </Button>
      }
    />
  );
}
