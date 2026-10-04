import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";
import type { PredecessorLink } from "@/domain/task/dependency";
import { TASK_STATUSES } from "@/domain/task/task.entity";
import { STATUS_LABELS } from "./task-status-badge";
import { TaskCard } from "./task-card";

export function TaskBoard({
  tasks,
  projects,
  projectId,
  predecessorMap,
}: {
  tasks: Task[];
  projects: Project[];
  projectId: string;
  predecessorMap: Record<string, PredecessorLink[]>;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pb-2 md:grid md:grid-cols-4 md:overflow-hidden md:pb-0">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div
            key={status}
            className="flex flex-col gap-3 rounded-lg bg-muted/30 p-3 md:min-h-0 md:rounded-none md:bg-transparent md:p-0"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-medium">{STATUS_LABELS[status]}</h3>
              <span className="text-xs tabular-nums text-muted-foreground">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-3 md:min-h-24 md:flex-1 md:overflow-y-auto md:rounded-lg md:border md:bg-muted/30 md:p-2">
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
                    projectTasks={tasks}
                    predecessors={predecessorMap[task.id] ?? []}
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
