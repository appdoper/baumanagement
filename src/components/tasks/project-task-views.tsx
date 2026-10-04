"use client";

import { LayoutGrid, List, Pencil, Plus, Trash2, Workflow } from "lucide-react";
import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";
import type { PredecessorLink } from "@/domain/task/dependency";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectFormSheet } from "@/components/projects/project-form-sheet";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { TaskFormSheet } from "./task-form-sheet";
import { TaskTable } from "./task-table";
import { TaskBoard } from "./task-board";
import { ProjectDependencyGraph } from "./project-dependency-graph";

export function ProjectTaskViews({
  project,
  childCount,
  tasks,
  projects,
  projectId,
  predecessorMap,
}: {
  project: Project;
  childCount: number;
  tasks: Task[];
  projects: Project[];
  projectId: string;
  predecessorMap: Record<string, PredecessorLink[]>;
}) {
  return (
    <Tabs defaultValue="list" className="flex h-full min-h-0 flex-col gap-4 p-4 md:p-8">
      <header className="flex shrink-0 flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight break-words sm:truncate">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <ProjectFormSheet
              projects={projects}
              project={project}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Projekt bearbeiten"
                >
                  <Pencil className="size-4" />
                  Bearbeiten
                </Button>
              }
            />
            <DeleteProjectDialog
              projectId={project.id}
              projectName={project.name}
              taskCount={tasks.length}
              childCount={childCount}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Projekt löschen"
                >
                  <Trash2 className="size-4" />
                </Button>
              }
            />
            <TaskFormSheet
              projects={projects}
              defaultProjectId={projectId}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  Neuer Vorgang
                </Button>
              }
            />
          </div>
        </div>

        <TabsList className="self-start">
          <TabsTrigger value="list">
            <List />
            Liste
          </TabsTrigger>
          <TabsTrigger value="board">
            <LayoutGrid />
            Board
          </TabsTrigger>
          <TabsTrigger value="graph">
            <Workflow />
            Graph
          </TabsTrigger>
        </TabsList>
      </header>

      <TabsContent value="list" className="min-h-0 flex-1 overflow-auto">
        <TaskTable
          tasks={tasks}
          projects={projects}
          predecessorMap={predecessorMap}
        />
      </TabsContent>
      <TabsContent value="board" className="min-h-0 flex-1 overflow-hidden">
        <TaskBoard
          tasks={tasks}
          projects={projects}
          projectId={projectId}
          predecessorMap={predecessorMap}
        />
      </TabsContent>
      <TabsContent value="graph" className="min-h-0 flex-1 overflow-hidden">
        <ProjectDependencyGraph tasks={tasks} predecessorMap={predecessorMap} />
      </TabsContent>
    </Tabs>
  );
}
