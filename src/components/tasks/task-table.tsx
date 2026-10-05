"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";
import { TASK_STATUSES } from "@/domain/task/task.entity";
import type { PredecessorLink } from "@/domain/task/dependency";
import { formatEuro, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskBlockedBadge } from "./task-blocked-badge";
import { PersonBadge } from "./person-badge";
import { TaskRowActions } from "./task-row-actions";
import { TaskQuickActions } from "./task-quick-actions";
import { TaskFormSheet } from "./task-form-sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SortKey = "status" | "plannedStart" | "deadline" | "cost";
type SortDir = "asc" | "desc";

const STATUS_ORDER = Object.fromEntries(
  TASK_STATUSES.map((s, i) => [s, i]),
) as Record<Task["status"], number>;

function sortValue(task: Task, key: SortKey): number | null {
  switch (key) {
    case "status":
      return STATUS_ORDER[task.status];
    case "cost":
      return task.estimatedCostCents;
    case "plannedStart":
      return task.plannedStart ? new Date(task.plannedStart).getTime() : null;
    case "deadline":
      return task.deadline ? new Date(task.deadline).getTime() : null;
  }
}

function sortTasks(tasks: Task[], key: SortKey, dir: SortDir): Task[] {
  return [...tasks].sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    // Missing values always sort to the bottom, regardless of direction.
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const base = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === "asc" ? base : -base;
  });
}

function SortHeader({
  label,
  columnKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  columnKey: SortKey;
  sort: { key: SortKey; dir: SortDir } | null;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort?.key === columnKey;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className={cn(
        "inline-flex items-center gap-1 rounded-md transition-colors hover:text-foreground",
        align === "right" && "flex-row-reverse",
        active ? "text-foreground" : "text-muted-foreground",
      )}
      aria-label={`Nach ${label} sortieren`}
    >
      {label}
      <Icon className="size-3.5" />
    </button>
  );
}

function TaskTableRow({
  task,
  projects,
  tasks,
  predecessors,
}: {
  task: Task;
  projects: Project[];
  tasks: Task[];
  predecessors: PredecessorLink[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() => setOpen(true)}
        aria-label={`Vorgang „${task.title}“ bearbeiten`}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <span>{task.title}</span>
            {task.person && <PersonBadge person={task.person} />}
            <TaskBlockedBadge predecessors={predecessors} />
          </div>
        </TableCell>
        <TableCell>
          <TaskStatusBadge status={task.status} />
        </TableCell>
        <TableCell className="text-muted-foreground">
          {formatDate(task.plannedStart)}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {formatDate(task.deadline)}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {formatEuro(task.estimatedCostCents)}
        </TableCell>
        <TableCell>
          {/* Stop clicks on the actions from also opening the edit sheet. */}
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <TaskQuickActions task={task} />
            <TaskRowActions
              taskId={task.id}
              projectId={task.projectId}
              taskTitle={task.title}
            />
          </div>
        </TableCell>
      </TableRow>
      <TaskFormSheet
        projects={projects}
        task={task}
        projectTasks={tasks}
        predecessors={predecessors}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

function TaskMobileCard({
  task,
  projects,
  tasks,
  predecessors,
}: {
  task: Task;
  projects: Project[];
  tasks: Task[];
  predecessors: PredecessorLink[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex cursor-pointer flex-col gap-3 rounded-lg border p-4 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2 font-medium">
            <span className="break-words">{task.title}</span>
            {task.person && <PersonBadge person={task.person} />}
            <TaskBlockedBadge predecessors={predecessors} />
          </div>
          <TaskStatusBadge status={task.status} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>Startdatum: {formatDate(task.plannedStart)}</span>
          <span>Deadline: {formatDate(task.deadline)}</span>
          <span className="tabular-nums">
            {formatEuro(task.estimatedCostCents)}
          </span>
        </div>
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <TaskQuickActions task={task} />
          <TaskRowActions
            taskId={task.id}
            projectId={task.projectId}
            taskTitle={task.title}
          />
        </div>
      </div>
      <TaskFormSheet
        projects={projects}
        task={task}
        projectTasks={tasks}
        predecessors={predecessors}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function TaskTable({
  tasks,
  projects,
  predecessorMap,
}: {
  tasks: Task[];
  projects: Project[];
  predecessorMap: Record<string, PredecessorLink[]>;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  const sortedTasks = useMemo(
    () => (sort ? sortTasks(tasks, sort.key, sort.dir) : tasks),
    [tasks, sort],
  );

  function onSort(key: SortKey) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Noch keine Vorgänge in diesem Projekt.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards instead of a horizontally scrolling table. */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-xs font-medium text-muted-foreground">
            Sortieren:
          </span>
          <SortHeader label="Status" columnKey="status" sort={sort} onSort={onSort} />
          <SortHeader label="Startdatum" columnKey="plannedStart" sort={sort} onSort={onSort} />
          <SortHeader label="Deadline" columnKey="deadline" sort={sort} onSort={onSort} />
          <SortHeader label="Kosten" columnKey="cost" sort={sort} onSort={onSort} />
        </div>
        {sortedTasks.map((task) => (
          <TaskMobileCard
            key={task.id}
            task={task}
            projects={projects}
            tasks={tasks}
            predecessors={predecessorMap[task.id] ?? []}
          />
        ))}
      </div>

      {/* Tablet/desktop: full sortable table. */}
      <div className="hidden rounded-lg border md:block">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead className="w-32">
                <SortHeader label="Status" columnKey="status" sort={sort} onSort={onSort} />
              </TableHead>
              <TableHead className="w-36">
                <SortHeader label="Startdatum" columnKey="plannedStart" sort={sort} onSort={onSort} />
              </TableHead>
              <TableHead className="w-32">
                <SortHeader label="Deadline" columnKey="deadline" sort={sort} onSort={onSort} />
              </TableHead>
              <TableHead className="w-32 text-right">
                <SortHeader label="Kosten" columnKey="cost" sort={sort} onSort={onSort} align="right" />
              </TableHead>
              <TableHead className="w-40 text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => (
              <TaskTableRow
                key={task.id}
                task={task}
                projects={projects}
                tasks={tasks}
                predecessors={predecessorMap[task.id] ?? []}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
