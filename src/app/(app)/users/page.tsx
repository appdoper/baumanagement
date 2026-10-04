import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { userService } from "@/container";
import { UserManagement } from "@/components/users/user-management";

export default async function UsersPage() {
  const session = await auth();
  // Only admins manage users; everyone else goes back to the dashboard.
  if (session?.user?.role !== "ADMIN") redirect("/");

  const users = await userService.list();

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Benutzerverwaltung
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lege Mitbewohner an. Beim Anlegen wird ein Passwort generiert, das du
          einmalig weitergibst.
        </p>
      </header>

      <UserManagement users={users} currentUserId={session.user.id} />
    </div>
  );
}
