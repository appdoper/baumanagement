import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChangePasswordForm } from "./change-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session) redirect("/login");
  // Users who no longer need a change have no business here.
  if (!session.user.requiresPasswordChange) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Passwort festlegen</CardTitle>
          <CardDescription>
            Aus Sicherheitsgründen musst du vor dem ersten Zugriff ein eigenes
            Passwort vergeben.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
