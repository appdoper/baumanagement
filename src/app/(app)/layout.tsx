import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { locationService, projectService } from "@/container";
import { buildProjectTree } from "@/lib/project-tree";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const [projects, locations] = await Promise.all([
    projectService.list(),
    locationService.list(),
  ]);
  const tree = buildProjectTree(projects);
  const userEmail = session.user?.email;
  const isAdmin = session.user?.role === "ADMIN";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 border-r bg-sidebar text-sidebar-foreground md:block">
        <AppSidebar
          projects={projects}
          locations={locations}
          tree={tree}
          userEmail={userEmail}
          isAdmin={isAdmin}
        />
      </aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
          <MobileNav>
            <AppSidebar
              projects={projects}
              locations={locations}
              tree={tree}
              userEmail={userEmail}
              isAdmin={isAdmin}
            />
          </MobileNav>
          <Link href="/" className="font-semibold tracking-tight">
            Baumanagement
          </Link>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>

      <Toaster richColors />
    </div>
  );
}
