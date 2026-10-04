import Link from "next/link";
import { projectService } from "@/container";
import { buildProjectTree } from "@/lib/project-tree";
import { ProjectNav } from "@/components/projects/project-nav";
import { NewProjectButton } from "@/components/projects/new-project-button";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const projects = await projectService.list();
  const tree = buildProjectTree(projects);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-72 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="font-semibold tracking-tight">
            Hausmanagement
          </Link>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Projekte
          </span>
          <NewProjectButton projects={projects} />
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {tree.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              Noch keine Projekte.
            </p>
          ) : (
            <ProjectNav nodes={tree} />
          )}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
      <Toaster richColors />
    </div>
  );
}
