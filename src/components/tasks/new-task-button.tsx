"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Project } from "@/domain/project/project.entity";
import { TaskForm } from "./task-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function NewTaskButton({
  projects,
  defaultProjectId,
}: {
  projects: Project[];
  defaultProjectId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button />}>
        <Plus className="size-4" />
        Neuer Vorgang
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Neuer Vorgang</SheetTitle>
          <SheetDescription>
            Lege einen neuen Vorgang an. Pflichtfelder sind markiert.
          </SheetDescription>
        </SheetHeader>
        <TaskForm
          projects={projects}
          defaultProjectId={defaultProjectId}
          onSuccess={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
