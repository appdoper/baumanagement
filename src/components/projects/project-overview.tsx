"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleDot, Euro, MapPin, Settings2 } from "lucide-react";
import type { ProjectWithMetrics } from "@/domain/project/project.repository";
import type { Location } from "@/domain/location/location.entity";
import { formatEuro } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationManager } from "./location-manager";

const ALL = "__all__";
const NONE = "__none__";

export function ProjectOverview({
  projects,
  locations,
}: {
  projects: ProjectWithMetrics[];
  locations: Location[];
}) {
  const [filter, setFilter] = useState<string>(ALL);

  const nameById = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations],
  );

  const filtered = useMemo(() => {
    if (filter === ALL) return projects;
    if (filter === NONE)
      return projects.filter((p) => p.locationIds.length === 0);
    return projects.filter((p) => p.locationIds.includes(filter));
  }, [projects, filter]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto p-4 md:p-8">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Übersicht</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Offene Vorgänge und geschätzte Gesamtkosten pro Projekt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Standort:</span>
          <Select
            items={{
              [ALL]: "Alle Standorte",
              ...Object.fromEntries(locations.map((l) => [l.id, l.name])),
              [NONE]: "Ohne Standort",
            }}
            value={filter}
            onValueChange={(v) => setFilter(v ?? ALL)}
          >
            <SelectTrigger size="sm" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Alle Standorte</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
              <SelectItem value={NONE}>Ohne Standort</SelectItem>
            </SelectContent>
          </Select>
          <LocationManager
            locations={locations}
            trigger={
              <Button variant="outline" size="sm">
                <Settings2 className="size-4" />
                Standorte verwalten
              </Button>
            }
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Keine Projekte für diesen Standort.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-xl outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full gap-4 transition-colors hover:border-ring">
                <CardHeader>
                  <CardTitle className="truncate">{project.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  {project.locationIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.locationIds.map((id) => {
                        const name = nameById.get(id);
                        if (!name) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            <MapPin className="size-3" />
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
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
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
