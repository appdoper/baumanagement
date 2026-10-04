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

  // Base UI renders <Select.Value> from the raw value unless `items` maps
  // values → labels. Without it the trigger would show the ID or "__none__".
  const parentItems: Record<string, string> = {
    [NONE]: "Keines (Hauptprojekt)",
    ...Object.fromEntries(parentOptions.map((p) => [p.id, p.name])),
  };

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
      <SheetContent className="gap-0 data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 pb-4">
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
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
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
                className="min-h-[150px]"
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-parent">Übergeordnetes Projekt</Label>
              <Select
                items={parentItems}
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
          </div>

          <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t">
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
