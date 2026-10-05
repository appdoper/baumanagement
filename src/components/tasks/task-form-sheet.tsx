"use client";

import { useState, type ReactElement } from "react";
import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";
import type { PredecessorLink } from "@/domain/task/dependency";
import { TaskForm } from "./task-form";
import { TaskDependencies } from "./task-dependencies";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TaskFormSheet({
  projects,
  defaultProjectId,
  task,
  projectTasks = [],
  predecessors = [],
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  projects: Project[];
  defaultProjectId?: string;
  task?: Task;
  projectTasks?: Task[];
  predecessors?: PredecessorLink[];
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;
  const isEdit = Boolean(task);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger render={trigger} />}
      <SheetContent className="gap-0 data-[side=right]:sm:max-w-2xl">
        <SheetHeader className="shrink-0 pb-4">
          <SheetTitle>{isEdit ? "Vorgang bearbeiten" : "Neuer Vorgang"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Passe die Felder an und speichere die Änderungen."
              : "Lege einen neuen Vorgang an. Pflichtfelder sind markiert."}
          </SheetDescription>
        </SheetHeader>
        {open &&
          (isEdit && task ? (
            <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col gap-3">
              <TabsList className="mx-4 self-start">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="dependencies">Abhängigkeiten</TabsTrigger>
              </TabsList>
              <TabsContent
                value="details"
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <TaskForm
                  projects={projects}
                  defaultProjectId={defaultProjectId}
                  task={task}
                  onSuccess={() => setOpen(false)}
                />
              </TabsContent>
              <TabsContent
                value="dependencies"
                className="min-h-0 flex-1 overflow-y-auto px-4 py-2"
              >
                <TaskDependencies
                  task={task}
                  projectTasks={projectTasks}
                  predecessors={predecessors}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <TaskForm
              projects={projects}
              defaultProjectId={defaultProjectId}
              task={task}
              onSuccess={() => setOpen(false)}
            />
          ))}
      </SheetContent>
    </Sheet>
  );
}
