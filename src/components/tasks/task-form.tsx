"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Project } from "@/domain/project/project.entity";
import { TASK_STATUSES } from "@/domain/task/task.entity";
import { createTaskAction } from "@/app/actions/task.actions";
import { eurosToCents } from "@/lib/format";
import { STATUS_LABELS } from "./task-status-badge";
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

const formSchema = z.object({
  title: z.string().trim().min(1, "Titel ist erforderlich."),
  projectId: z.string().min(1, "Projekt ist erforderlich."),
  description: z.string().trim().optional(),
  status: z.enum(TASK_STATUSES),
  estimatedCostEuros: z
    .string()
    .optional()
    .refine(
      (v) => !v || !Number.isNaN(Number(v.replace(",", "."))),
      "Ungültiger Betrag.",
    ),
  deadline: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function TaskForm({
  projects,
  defaultProjectId,
  onSuccess,
}: {
  projects: Project[];
  defaultProjectId?: string;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      projectId: defaultProjectId ?? "",
      description: "",
      status: "TODO",
      estimatedCostEuros: "",
      deadline: "",
    },
  });

  const projectId = watch("projectId");
  const status = watch("status");

  function onSubmit(values: FormValues) {
    const euros = values.estimatedCostEuros
      ? Number(values.estimatedCostEuros.replace(",", "."))
      : null;

    startTransition(async () => {
      const result = await createTaskAction({
        title: values.title,
        projectId: values.projectId,
        description: values.description || null,
        status: values.status,
        estimatedCostCents: euros != null ? eurosToCents(euros) : null,
        deadline: values.deadline || null,
      });
      if (result.ok) {
        toast.success("Vorgang erstellt.");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 px-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">Titel *</Label>
        <Input id="task-title" {...register("title")} autoFocus />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-project">Projekt *</Label>
        <Select value={projectId} onValueChange={(v) => setValue("projectId", v ?? "")}>
          <SelectTrigger id="task-project" className="w-full">
            <SelectValue placeholder="Projekt wählen" />
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
        <Label htmlFor="task-description">Beschreibung</Label>
        <Textarea id="task-description" rows={4} {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task-status">Status</Label>
          <Select value={status} onValueChange={(v) => setValue("status", (v ?? "TODO") as FormValues["status"])}>
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

      <SheetFooter className="px-0">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Speichern…" : "Vorgang erstellen"}
        </Button>
      </SheetFooter>
    </form>
  );
}
