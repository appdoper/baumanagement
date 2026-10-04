"use client";

import { LayoutGrid, List } from "lucide-react";
import type { Project } from "@/domain/project/project.entity";
import type { Task } from "@/domain/task/task.entity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskTable } from "./task-table";
import { TaskBoard } from "./task-board";

export function ProjectTaskViews({
  tasks,
  projects,
  projectId,
}: {
  tasks: Task[];
  projects: Project[];
  projectId: string;
}) {
  return (
    <Tabs defaultValue="list" className="gap-4">
      <TabsList>
        <TabsTrigger value="list">
          <List />
          Liste
        </TabsTrigger>
        <TabsTrigger value="board">
          <LayoutGrid />
          Board
        </TabsTrigger>
      </TabsList>
      <TabsContent value="list">
        <TaskTable tasks={tasks} projects={projects} />
      </TabsContent>
      <TabsContent value="board">
        <TaskBoard tasks={tasks} projects={projects} projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}
