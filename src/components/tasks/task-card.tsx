"use client";

import { useTransition } from "react";
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
import { TaskRowActions } from "./task-row-actions";
import { TaskQuickActions } from "./task-quick-actions";
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
  const overdue = isOverdue(task);

  function onStatusChange(v: string | null) {
    const status = (v ?? task.status) as TaskStatus;
    if (status === task.status) return;
    startTransition(async () => {
      const res = await updateTaskStatusAction(task.id, status, projectId);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div
      className={cn(
        "rounded-md border bg-background p-3 shadow-sm transition-opacity",
        isPending && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <TaskRowActions
          task={task}
          projects={projects}
          projectTasks={projectTasks}
          predecessors={predecessors}
        />
      </div>

      {predecessors.length > 0 && (
        <div className="mt-2">
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

      <div className="mt-3 flex items-center gap-2">
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
  );
}
