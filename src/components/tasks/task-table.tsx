import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";
import { formatEuro, formatDate } from "@/lib/format";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskRowActions } from "./task-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TaskTable({
  tasks,
  projects,
}: {
  tasks: Task[];
  projects: Project[];
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Noch keine Vorgänge in diesem Projekt.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titel</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-32">Deadline</TableHead>
            <TableHead className="w-32 text-right">Kosten</TableHead>
            <TableHead className="w-24 text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <TaskStatusBadge status={task.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(task.deadline)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEuro(task.estimatedCostCents)}
              </TableCell>
              <TableCell>
                <TaskRowActions task={task} projects={projects} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
