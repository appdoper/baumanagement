"use client";

import { useMemo, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { Task } from "@/domain/task/task.entity";
import type {
  PredecessorLink,
  SupportedDependencyType,
} from "@/domain/task/dependency";
import { SUPPORTED_DEPENDENCY_TYPES } from "@/domain/task/dependency";
import {
  addDependencyAction,
  removeDependencyAction,
} from "@/app/actions/dependency.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TaskStatusBadge } from "./task-status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_LABELS: Record<SupportedDependencyType, string> = {
  FINISH_TO_START: "Finish-to-Start (FS)",
  START_TO_START: "Start-to-Start (SS)",
};

const TYPE_ITEMS: Record<string, string> = TYPE_LABELS;

export function TaskDependencies({
  task,
  projectTasks,
  predecessors,
}: {
  task: Task;
  projectTasks: Task[];
  predecessors: PredecessorLink[];
}) {
  const [isPending, startTransition] = useTransition();
  const [predecessorId, setPredecessorId] = useState<string>("");
  const [type, setType] = useState<SupportedDependencyType>("FINISH_TO_START");

  const linkedIds = useMemo(
    () => new Set(predecessors.map((p) => p.predecessor.id)),
    [predecessors],
  );

  // Only tasks from the same project, never the task itself, never already linked.
  const candidates = useMemo(
    () =>
      projectTasks.filter(
        (t) => t.id !== task.id && !linkedIds.has(t.id),
      ),
    [projectTasks, task.id, linkedIds],
  );

  const candidateItems = useMemo<Record<string, string>>(
    () => Object.fromEntries(candidates.map((t) => [t.id, t.title])),
    [candidates],
  );

  function onAdd() {
    if (!predecessorId) {
      toast.error("Bitte einen Vorgänger auswählen.");
      return;
    }
    startTransition(async () => {
      const res = await addDependencyAction({
        predecessorId,
        successorId: task.id,
        type,
        projectId: task.projectId,
      });
      if (res.ok) {
        toast.success("Abhängigkeit hinzugefügt.");
        setPredecessorId("");
        setType("FINISH_TO_START");
      } else {
        toast.error(res.error);
      }
    });
  }

  function onRemove(dependencyId: string) {
    startTransition(async () => {
      const res = await removeDependencyAction(dependencyId, task.projectId);
      if (res.ok) {
        toast.success("Abhängigkeit entfernt.");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 px-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Vorgänger (Blocker)</h3>
        {predecessors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine Abhängigkeiten. Dieser Vorgang wird von keinem anderen
            blockiert.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {predecessors.map((link) => (
              <li
                key={link.dependencyId}
                className="flex items-center justify-between gap-2 rounded-md border p-2"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-medium">
                    {link.predecessor.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {TYPE_LABELS[link.type as SupportedDependencyType] ??
                        link.type}
                    </span>
                    <TaskStatusBadge status={link.predecessor.status} />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Abhängigkeit entfernen"
                  disabled={isPending}
                  onClick={() => onRemove(link.dependencyId)}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <h3 className="text-sm font-medium">Abhängigkeit hinzufügen</h3>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine weiteren Vorgänge im Projekt verfügbar.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="dep-predecessor">Vorgänger</Label>
              <Select
                items={candidateItems}
                value={predecessorId}
                onValueChange={(v) => setPredecessorId(v ?? "")}
              >
                <SelectTrigger id="dep-predecessor" className="w-full">
                  <SelectValue placeholder="Bitte wählen" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dep-type">Typ</Label>
              <Select
                items={TYPE_ITEMS}
                value={type}
                onValueChange={(v) =>
                  setType((v ?? "FINISH_TO_START") as SupportedDependencyType)
                }
              >
                <SelectTrigger id="dep-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_DEPENDENCY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={isPending}
              onClick={onAdd}
            >
              {isPending ? "Speichern…" : "Hinzufügen"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
