import Link from "next/link";
import { Plus, Users } from "lucide-react";
import type { Project } from "@/domain/project/project.entity";
import type { ProjectNode } from "@/lib/project-tree";
import { ProjectNav } from "@/components/projects/project-nav";
import { ProjectFormSheet } from "@/components/projects/project-form-sheet";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";

export function AppSidebar({
  projects,
  tree,
  userEmail,
  isAdmin = false,
}: {
  projects: Project[];
  tree: ProjectNode[];
  userEmail?: string | null;
  isAdmin?: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center border-b px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Hausmanagement
        </Link>
      </div>

      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Projekte
        </span>
        <ProjectFormSheet
          projects={projects}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Neues Projekt"
            >
              <Plus className="size-4" />
            </Button>
          }
        />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {tree.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            Noch keine Projekte.
          </p>
        ) : (
          <ProjectNav nodes={tree} />
        )}
      </nav>

      <div className="shrink-0 border-t p-3">
        {isAdmin && (
          <Link
            href="/users"
            className="mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Users className="size-4" />
            Benutzerverwaltung
          </Link>
        )}
        {userEmail && (
          <p className="truncate px-1 pb-1.5 text-xs text-muted-foreground">
            {userEmail}
          </p>
        )}
        <LogoutButton />
      </div>
    </div>
  );
}
