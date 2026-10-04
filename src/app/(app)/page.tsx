import Link from "next/link";
import { CircleDot, Euro } from "lucide-react";
import { projectService } from "@/container";
import { formatEuro } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HomePage() {
  const projects = await projectService.listWithMetrics();

  if (projects.length === 0) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-xl font-semibold">Willkommen im Hausmanagement</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Lege über das Plus-Symbol in der Seitenleiste dein erstes Projekt an.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Übersicht</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Offene Vorgänge und geschätzte Gesamtkosten pro Projekt.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="rounded-xl outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full gap-4 transition-colors hover:border-ring">
              <CardHeader>
                <CardTitle className="truncate">{project.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CircleDot className="size-4" />
                  <span>
                    <span className="font-medium tabular-nums text-foreground">
                      {project.metrics.openTaskCount}
                    </span>{" "}
                    offen
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Euro className="size-4" />
                  <span className="font-medium tabular-nums text-foreground">
                    {formatEuro(project.metrics.totalCostCents)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
