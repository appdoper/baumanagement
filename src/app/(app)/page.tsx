import { locationService, projectService } from "@/container";
import { ProjectOverview } from "@/components/projects/project-overview";

export default async function HomePage() {
  const [projects, locations] = await Promise.all([
    projectService.listWithMetrics(),
    locationService.list(),
  ]);

  if (projects.length === 0) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-xl font-semibold">Willkommen im Baumanagement</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Lege über das Plus-Symbol in der Seitenleiste dein erstes Projekt an.
        </p>
      </div>
    );
  }

  return <ProjectOverview projects={projects} locations={locations} />;
}
