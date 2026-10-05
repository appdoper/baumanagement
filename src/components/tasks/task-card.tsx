"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Project } from "@/domain/project/project.entity";
import type { Task, TaskStatus } from "@/domain/task/task.entity";
import type { PredecessorLink } from "@/domain/task/dependency";
import { TASK_STATUSES } from "@/domain/task/task.entity";
import { updateTaskStatusAction } from "@/app/actions/task.actions";
import { formatEuro, formatDate } from "@/lib/format";
import { isOverdue } from "@/lib/task-date";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "./task-status-badge";
import { TaskBlockedBadge } from "./task-blocked-badge";
import { PersonBadge } from "./person-badge";
import { TaskRowActions } from "./task-row-actions";
import { TaskQuickActions } from "./task-quick-actions";
import { TaskFormSheet } from "./task-form-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TaskCard({
  task,
  projects,
  projectId,
  projectTasks,
  predecessors,
}: {
  task: Task;
  projects: Project[];
  projectId: string;
  projectTasks: Task[];
  predecessors: PredecessorLink[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const overdue = isOverdue(task);

  function onStatusChange(v: string | null) {
    const status = (v ?? task.status) as TaskStatus;
    if (status === task.status) return;
    startTransition(async () => {
      const res = await updateTaskStatusAction(
        task.id,
        status,
        projectId,
        task.version,
      );
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setEditOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setEditOpen(true);
          }
        }}
        className={cn(
          "cursor-pointer rounded-md border bg-background p-3 text-left shadow-sm transition-opacity",
          isPending && "opacity-60",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          <div onClick={(e) => e.stopPropagation()}>
            <TaskRowActions
              taskId={task.id}
              projectId={task.projectId}
              taskTitle={task.title}
            />
          </div>
        </div>

        {(task.person || predecessors.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.person && <PersonBadge person={task.person} />}
            <TaskBlockedBadge predecessors={predecessors} />
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <span
            className={cn(
              "text-muted-foreground",
              overdue && "font-medium text-destructive",
            )}
          >
            {task.deadline ? formatDate(task.deadline) : "Keine Deadline"}
            {overdue && " · überfällig"}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {formatEuro(task.estimatedCostCents)}
          </span>
        </div>

        <div
          className="mt-3 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Select items={STATUS_LABELS} value={task.status} onValueChange={onStatusChange}>
            <SelectTrigger size="sm" className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TaskQuickActions task={task} />
        </div>
      </div>

      <TaskFormSheet
        projects={projects}
        task={task}
        projectTasks={projectTasks}
        predecessors={predecessors}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
