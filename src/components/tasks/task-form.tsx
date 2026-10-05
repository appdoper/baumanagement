"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "@/domain/project/project.entity";
import type { Task, TaskPerson } from "@/domain/task/task.entity";
import { TASK_PERSONS, TASK_STATUSES } from "@/domain/task/task.entity";
import {
  createTaskAction,
  updateTaskAction,
} from "@/app/actions/task.actions";
import { eurosToCents, toDateInputValue } from "@/lib/format";
import { STATUS_LABELS } from "./task-status-badge";
import { PERSON_LABELS } from "./person-badge";
import { LinkifiedText } from "./linkified-text";
import { TaskAttachments } from "./task-attachments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetFooter } from "@/components/ui/sheet";
import {
  AUTOSAVE_DELAY_MS,
  AutoSaveStatus,
  type SaveState,
} from "@/components/shared/auto-save-status";

const NONE = "__none__";

const formSchema = z.object({
  title: z.string().trim().min(1, "Titel ist erforderlich."),
  projectId: z.string().min(1, "Projekt ist erforderlich."),
  description: z.string().trim().optional(),
  procurementSource: z.string().trim().optional(),
  person: z.string().optional(),
  status: z.enum(TASK_STATUSES),
  estimatedCostEuros: z
    .string()
    .optional()
    .refine(
      (v) => !v || !Number.isNaN(Number(v.replace(",", "."))),
      "Ungültiger Betrag.",
    ),
  plannedStart: z.string().optional(),
  plannedEnd: z.string().optional(),
  deadline: z.string().optional(),
}).refine(
  (v) => !v.plannedStart || !v.plannedEnd || v.plannedEnd >= v.plannedStart,
  { path: ["plannedEnd"], message: "Ende darf nicht vor dem Start liegen." },
);

type FormValues = z.infer<typeof formSchema>;

const URL_LIKE = /^(https?:\/\/|www\.)/i;

function buildPayload(values: FormValues, version?: number) {
  const euros = values.estimatedCostEuros
    ? Number(values.estimatedCostEuros.replace(",", "."))
    : null;
  return {
    title: values.title,
    projectId: values.projectId,
    description: values.description || null,
    procurementSource: values.procurementSource || null,
    person:
      values.person && values.person !== NONE
        ? (values.person as TaskPerson)
        : null,
    status: values.status,
    estimatedCostCents: euros != null ? eurosToCents(euros) : null,
    plannedStart: values.plannedStart || null,
    plannedEnd: values.plannedEnd || null,
    deadline: values.deadline || null,
    // Optimistic-concurrency token (only meaningful on update).
    version,
  };
}

export function TaskForm({
  projects,
  defaultProjectId,
  task,
  onSuccess,
}: {
  projects: Project[];
  defaultProjectId?: string;
  task?: Task;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(task);
  // Show existing descriptions as rendered (clickable) text first; start in
  // edit mode when there is nothing to show yet.
  const [editingDescription, setEditingDescription] = useState(
    !task?.description,
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      title: task?.title ?? "",
      projectId: task?.projectId ?? defaultProjectId ?? "",
      description: task?.description ?? "",
      procurementSource: task?.procurementSource ?? "",
      person: task?.person ?? NONE,
      status: task?.status ?? "TODO",
      estimatedCostEuros:
        task?.estimatedCostCents != null
          ? String(task.estimatedCostCents / 100)
          : "",
      plannedStart: toDateInputValue(task?.plannedStart),
      plannedEnd: toDateInputValue(task?.plannedEnd),
      deadline: toDateInputValue(task?.deadline),
    },
  });

  const projectId = watch("projectId");
  const status = watch("status");
  const person = watch("person") ?? NONE;
  const description = watch("description") ?? "";
  const procurementSource = watch("procurementSource") ?? "";

  const personItems: Record<string, string> = {
    [NONE]: "Keine",
    ...PERSON_LABELS,
  };

  // Base UI needs `items` (value → label) so the trigger shows names, not IDs.
  const projectItems: Record<string, string> = Object.fromEntries(
    projects.map((p) => [p.id, p.name]),
  );

  // --- Create mode: explicit submit (a brand-new task can't auto-save). ---
  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await createTaskAction(buildPayload(values));
      if (result.ok) {
        toast.success("Vorgang erstellt.");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  // --- Edit mode: debounced auto-save, no save button. ---
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  // Current server version; advanced after every successful save so the next
  // save carries the up-to-date optimistic-concurrency token.
  const versionRef = useRef<number | undefined>(task?.version);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);

  const runSave = useCallback(async () => {
    if (!task) return;
    // Don't persist an invalid form (e.g. empty title); wait for a valid edit.
    if (!(await trigger())) return;
    // One save in flight at a time; coalesce further changes into a re-run.
    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }
    savingRef.current = true;
    setSaveState("saving");

    const result = await updateTaskAction(
      task.id,
      buildPayload(getValues(), versionRef.current),
    );

    savingRef.current = false;
    if (result.ok) {
      versionRef.current = result.data.version;
      setSaveError(null);
      setSaveState("saved");
    } else {
      setSaveError(result.error);
      setSaveState("error");
    }

    if (pendingRef.current) {
      pendingRef.current = false;
      void runSave();
    }
  }, [task, trigger, getValues]);

  // Debounce changes, then auto-save.
  useEffect(() => {
    if (!isEdit) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = watch(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void runSave(), AUTOSAVE_DELAY_MS);
    });
    return () => {
      if (timer) clearTimeout(timer);
      sub.unsubscribe();
    };
  }, [isEdit, watch, runSave]);

  return (
    <form
      onSubmit={
        isEdit
          ? (e) => {
              // Enter triggers an immediate save instead of a create.
              e.preventDefault();
              void runSave();
            }
          : handleSubmit(onSubmit)
      }
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor="task-title">Titel *</Label>
          <Input id="task-title" {...register("title")} autoFocus />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-project">Projekt *</Label>
          <Select items={projectItems} value={projectId} onValueChange={(v) => setValue("projectId", v ?? "")}>
            <SelectTrigger id="task-project" className="w-full">
              <SelectValue placeholder="Bitte wählen" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectId && (
            <p className="text-sm text-destructive">{errors.projectId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="task-description">Beschreibung</Label>
            {!editingDescription && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingDescription(true)}
              >
                <Pencil className="size-3.5" />
                Bearbeiten
              </Button>
            )}
          </div>
          {editingDescription ? (
            <Textarea
              id="task-description"
              className="min-h-[200px]"
              {...register("description")}
            />
          ) : (
            <div
              onClick={() => setEditingDescription(true)}
              title="Zum Bearbeiten klicken"
              className="min-h-[80px] cursor-text whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm"
            >
              {description ? (
                <LinkifiedText text={description} />
              ) : (
                <span className="text-muted-foreground">
                  Keine Beschreibung.
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-procurement">Beschaffungsquelle</Label>
          <Input
            id="task-procurement"
            placeholder="Händler, Lieferant oder Link"
            {...register("procurementSource")}
          />
          {URL_LIKE.test(procurementSource.trim()) && (
            <p className="text-xs">
              <LinkifiedText text={procurementSource.trim()} />
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-person">Person</Label>
          <Select
            items={personItems}
            value={person}
            onValueChange={(v) => setValue("person", v ?? NONE)}
          >
            <SelectTrigger id="task-person" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Keine</SelectItem>
              {TASK_PERSONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PERSON_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="task-planned-start">Durchführung (Start)</Label>
            <Input
              id="task-planned-start"
              type="date"
              {...register("plannedStart")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-planned-end">Durchführung (Ende)</Label>
            <Input
              id="task-planned-end"
              type="date"
              {...register("plannedEnd")}
            />
            {errors.plannedEnd && (
              <p className="text-sm text-destructive">
                {errors.plannedEnd.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="task-status">Status</Label>
            <Select items={STATUS_LABELS} value={status} onValueChange={(v) => setValue("status", (v ?? "TODO") as FormValues["status"])}>
              <SelectTrigger id="task-status" className="w-full">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-deadline">Deadline</Label>
            <Input id="task-deadline" type="date" {...register("deadline")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-cost">Geschätzte Kosten (€)</Label>
          <Input
            id="task-cost"
            inputMode="decimal"
            placeholder="z. B. 150,00"
            {...register("estimatedCostEuros")}
          />
          {errors.estimatedCostEuros && (
            <p className="text-sm text-destructive">
              {errors.estimatedCostEuros.message}
            </p>
          )}
        </div>

        {task ? (
          <div className="border-t pt-4">
            <TaskAttachments taskId={task.id} projectId={task.projectId} />
          </div>
        ) : (
          <p className="border-t pt-4 text-xs text-muted-foreground">
            Anhänge können nach dem Erstellen des Vorgangs hinzugefügt werden.
          </p>
        )}
      </div>

      <SheetFooter className="shrink-0 flex-row items-center justify-end gap-2 border-t">
        {isEdit ? (
          <AutoSaveStatus state={saveState} error={saveError} />
        ) : (
          <Button type="submit" disabled={isPending}>
            {isPending ? "Speichern…" : "Vorgang erstellen"}
          </Button>
        )}
      </SheetFooter>
    </form>
  );
}
