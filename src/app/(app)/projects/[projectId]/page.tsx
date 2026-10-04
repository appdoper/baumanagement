import { notFound } from "next/navigation";
import { projectService, taskService } from "@/container";
import { NotFoundError } from "@/domain/shared/errors";
import { TaskTable } from "@/components/tasks/task-table";
import { NewTaskButton } from "@/components/tasks/new-task-button";

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

  return (
    <div className="flex flex-col gap-6 p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <NewTaskButton projects={projects} defaultProjectId={projectId} />
      </header>

      <TaskTable tasks={tasks} />
    </div>
  );
}
