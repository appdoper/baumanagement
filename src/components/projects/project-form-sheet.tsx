"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Project } from "@/domain/project/project.entity";
import {
  createProjectAction,
  updateProjectAction,
} from "@/app/actions/project.actions";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NONE = "__none__";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich."),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProjectFormSheet({
  projects,
  project,
  defaultParentId,
  trigger,
}: {
  projects: Project[];
  project?: Project;
  defaultParentId?: string | null;
  trigger: ReactElement;
}) {
  const isEdit = Boolean(project);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initialParent = project?.parentId ?? defaultParentId ?? null;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      parentId: initialParent ?? NONE,
    },
  });

  // Exclude the project itself from the parent options to avoid self-reference.
  const parentOptions = projects.filter((p) => p.id !== project?.id);

  function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      description: values.description?.trim() ? values.description.trim() : null,
      parentId:
        values.parentId && values.parentId !== NONE ? values.parentId : null,
    };
    startTransition(async () => {
      const result = project
        ? await updateProjectAction(project.id, payload)
        : await createProjectAction(payload);
      if (result.ok) {
        toast.success(isEdit ? "Projekt aktualisiert." : "Projekt erstellt.");
        if (!isEdit) {
          reset({ name: "", description: "", parentId: NONE });
        }
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Projekt bearbeiten" : "Neues Projekt"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Passe Name, Beschreibung oder Einordnung des Projekts an."
              : "Lege ein Projekt oder Unterprojekt (WBS) an."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-4 px-4"
        >
          <div className="space-y-2">
            <Label htmlFor="project-name">Name *</Label>
            <Input id="project-name" {...register("name")} autoFocus />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Beschreibung</Label>
            <Textarea
              id="project-description"
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-parent">Übergeordnetes Projekt</Label>
            <Select
              defaultValue={initialParent ?? NONE}
              onValueChange={(v) => setValue("parentId", v ?? undefined)}
            >
              <SelectTrigger id="project-parent" className="w-full">
                <SelectValue placeholder="Keines (Hauptprojekt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Keines (Hauptprojekt)</SelectItem>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Speichern…"
                : isEdit
                  ? "Änderungen speichern"
                  : "Projekt erstellen"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
