"use client";

import { useState, type ReactElement } from "react";
import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";
import { TaskForm } from "./task-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function TaskFormSheet({
  projects,
  defaultProjectId,
  task,
  trigger,
}: {
  projects: Project[];
  defaultProjectId?: string;
  task?: Task;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(task);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Vorgang bearbeiten" : "Neuer Vorgang"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Passe die Felder an und speichere die Änderungen."
              : "Lege einen neuen Vorgang an. Pflichtfelder sind markiert."}
          </SheetDescription>
        </SheetHeader>
        {open && (
          <TaskForm
            projects={projects}
            defaultProjectId={defaultProjectId}
            task={task}
            onSuccess={() => setOpen(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
