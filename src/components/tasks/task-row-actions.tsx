"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";
import type { PredecessorLink } from "@/domain/task/dependency";
import { Button } from "@/components/ui/button";
import { TaskFormSheet } from "./task-form-sheet";
import { DeleteTaskDialog } from "./delete-task-dialog";

export function TaskRowActions({
  task,
  projects,
  projectTasks,
  predecessors,
}: {
  task: Task;
  projects: Project[];
  projectTasks: Task[];
  predecessors: PredecessorLink[];
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <TaskFormSheet
        projects={projects}
        task={task}
        projectTasks={projectTasks}
        predecessors={predecessors}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Vorgang bearbeiten"
          >
            <Pencil className="size-4" />
          </Button>
        }
      />
      <DeleteTaskDialog
        taskId={task.id}
        projectId={task.projectId}
        taskTitle={task.title}
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
    </div>
  );
}
