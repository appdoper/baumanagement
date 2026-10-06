"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Eye, EyeOff, LayoutGrid, List, Pencil, Plus, Trash2, Workflow } from "lucide-react";
import type { Project } from "@/domain/project/project.entity";
import type { Location } from "@/domain/location/location.entity";
import type { Task } from "@/domain/task/task.entity";
import { TASK_PERSONS } from "@/domain/task/task.entity";
import type { PredecessorLink } from "@/domain/task/dependency";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectFormSheet } from "@/components/projects/project-form-sheet";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { TaskFormSheet } from "./task-form-sheet";
import { TaskTable } from "./task-table";
import { TaskBoard } from "./task-board";
import { ProjectDependencyGraph } from "./project-dependency-graph";
import { ProjectCalendarView } from "./project-calendar-view";
import { PERSON_LABELS } from "./person-badge";

const ALL = "__all__";
const NONE = "__none__";

export function ProjectTaskViews({
  project,
  childCount,
  tasks,
  projects,
  locations,
  projectId,
  predecessorMap,
}: {
  project: Project;
  childCount: number;
  tasks: Task[];
  projects: Project[];
  locations: Location[];
  projectId: string;
  predecessorMap: Record<string, PredecessorLink[]>;
}) {
  const [personFilter, setPersonFilter] = useState<string>(ALL);
  // Done tasks are hidden by default; the toggle reveals them.
  const [showDone, setShowDone] = useState(false);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (personFilter === NONE) result = result.filter((t) => !t.person);
    else if (personFilter !== ALL)
      result = result.filter((t) => t.person === personFilter);
    if (!showDone) result = result.filter((t) => t.status !== "DONE");
    return result;
  }, [tasks, personFilter, showDone]);

  const doneCount = useMemo(
    () => tasks.filter((t) => t.status === "DONE").length,
    [tasks],
  );

  const personItems: Record<string, string> = {
    [ALL]: "Alle Personen",
    ...PERSON_LABELS,
    [NONE]: "Ohne Person",
  };

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
              locations={locations}
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

        <div className="flex flex-wrap items-center justify-between gap-3">
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
            <TabsTrigger value="calendar">
              <CalendarDays />
              Kalender
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={showDone ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowDone((v) => !v)}
              aria-pressed={showDone}
              title={
                showDone ? "Erledigte Vorgänge ausblenden" : "Erledigte Vorgänge anzeigen"
              }
            >
              {showDone ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              {showDone ? "Erledigte ausblenden" : "Erledigte anzeigen"}
              {doneCount > 0 && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  ({doneCount})
                </span>
              )}
            </Button>

            <span className="text-sm text-muted-foreground">Person:</span>
            <Select
              items={personItems}
              value={personFilter}
              onValueChange={(v) => setPersonFilter(v ?? ALL)}
            >
              <SelectTrigger size="sm" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Alle Personen</SelectItem>
                {TASK_PERSONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PERSON_LABELS[p]}
                  </SelectItem>
                ))}
                <SelectItem value={NONE}>Ohne Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <TabsContent value="list" className="min-h-0 flex-1 overflow-auto">
        <TaskTable
          tasks={filteredTasks}
          projects={projects}
          predecessorMap={predecessorMap}
        />
      </TabsContent>
      <TabsContent value="board" className="min-h-0 flex-1 overflow-hidden">
        <TaskBoard
          tasks={filteredTasks}
          projects={projects}
          projectId={projectId}
          predecessorMap={predecessorMap}
        />
      </TabsContent>
      <TabsContent value="graph" className="min-h-0 flex-1 overflow-hidden">
        {/* Graph shows the full dependency network regardless of the filter. */}
        <ProjectDependencyGraph tasks={tasks} predecessorMap={predecessorMap} />
      </TabsContent>
      <TabsContent value="calendar" className="min-h-0 flex-1 overflow-hidden">
        <ProjectCalendarView
          tasks={filteredTasks}
          projects={projects}
          predecessorMap={predecessorMap}
        />
      </TabsContent>
    </Tabs>
  );
}
