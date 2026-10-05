import { notFound } from "next/navigation";
import {
  dependencyService,
  locationService,
  projectService,
  taskService,
} from "@/container";
import { NotFoundError } from "@/domain/shared/errors";
import { ProjectTaskViews } from "@/components/tasks/project-task-views";

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

  const [tasks, projects, locations] = await Promise.all([
    taskService.list({ projectId }),
    projectService.list(),
    locationService.list(),
  ]);

  const predecessorMap = await dependencyService.getPredecessorMap(
    tasks.map((t) => t.id),
  );

  const childCount = projects.filter((p) => p.parentId === projectId).length;

  return (
    <ProjectTaskViews
      project={project}
      childCount={childCount}
      tasks={tasks}
      projects={projects}
      locations={locations}
      projectId={projectId}
      predecessorMap={predecessorMap}
    />
  );
}
