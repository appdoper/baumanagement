"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Project } from "@/domain/project/project.entity";
import { createProjectAction } from "@/app/actions/project.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  parentId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function NewProjectButton({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", parentId: NONE },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await createProjectAction({
        name: values.name,
        parentId: values.parentId && values.parentId !== NONE ? values.parentId : null,
      });
      if (result.ok) {
        toast.success("Projekt erstellt.");
        reset({ name: "", parentId: NONE });
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Neues Projekt"
          />
        }
      >
        <Plus className="size-4" />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Neues Projekt</SheetTitle>
          <SheetDescription>
            Lege ein Projekt oder Unterprojekt (WBS) an.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name *</Label>
            <Input id="project-name" {...register("name")} autoFocus />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-parent">Übergeordnetes Projekt</Label>
            <Select
              defaultValue={NONE}
              onValueChange={(v) => setValue("parentId", v ?? undefined)}
            >
              <SelectTrigger id="project-parent" className="w-full">
                <SelectValue placeholder="Keines (Hauptprojekt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Keines (Hauptprojekt)</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Speichern…" : "Projekt erstellen"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
