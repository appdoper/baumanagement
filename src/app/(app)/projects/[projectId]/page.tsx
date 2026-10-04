import { notFound } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { projectService, taskService } from "@/container";
import { NotFoundError } from "@/domain/shared/errors";
import { Button } from "@/components/ui/button";
import { ProjectTaskViews } from "@/components/tasks/project-task-views";
import { TaskFormSheet } from "@/components/tasks/task-form-sheet";
import { ProjectFormSheet } from "@/components/projects/project-form-sheet";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  let project;
  try {
    project = await projectService.getById(projectId);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const [tasks, projects] = await Promise.all([
    taskService.list({ projectId }),
    projectService.list(),
  ]);

  const childCount = projects.filter((p) => p.parentId === projectId).length;

  return (
    <div className="flex flex-col gap-6 p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ProjectFormSheet
            projects={projects}
            project={project}
            trigger={
              <Button variant="outline" size="sm" aria-label="Projekt bearbeiten">
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
      </header>

      <ProjectTaskViews tasks={tasks} projects={projects} projectId={projectId} />
    </div>
  );
}
