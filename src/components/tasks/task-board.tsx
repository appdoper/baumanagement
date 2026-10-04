import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";
import { TASK_STATUSES } from "@/domain/task/task.entity";
import { STATUS_LABELS } from "./task-status-badge";
import { TaskCard } from "./task-card";

export function TaskBoard({
  tasks,
  projects,
  projectId,
}: {
  tasks: Task[];
  projects: Project[];
  projectId: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-medium">{STATUS_LABELS[status]}</h3>
              <span className="text-xs tabular-nums text-muted-foreground">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex min-h-24 flex-col gap-3 rounded-lg border bg-muted/30 p-2">
              {columnTasks.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                  Keine Vorgänge
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projects={projects}
                    projectId={projectId}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
