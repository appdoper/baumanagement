"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { User, UserRole } from "@/domain/user/user.entity";
import { createUserAction } from "@/app/actions/user.actions";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  USER: "Benutzer",
};

type Credentials = { email: string; password: string };

export function UserManagement({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [created, setCreated] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreated(null);
    startTransition(async () => {
      const res = await createUserAction({
        name: name.trim() || null,
        email,
        role,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCreated(res.data);
      setCopied(false);
      setName("");
      setEmail("");
      setRole("USER");
      router.refresh();
    });
  }

  async function copyPassword() {
    if (!created) return;
    await navigator.clipboard.writeText(created.password);
    setCopied(true);
    toast.success("Passwort kopiert.");
  }

  return (
    <div className="flex flex-col gap-8">
      <Card className="max-w-xl gap-4">
        <CardHeader>
          <CardTitle className="text-base">Neuen Benutzer anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max@haus.local"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rolle</Label>
              <Select
                items={ROLE_LABELS}
                value={role}
                onValueChange={(v) => setRole((v ?? "USER") as UserRole)}
              >
                <SelectTrigger size="sm" className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isPending} className="self-start">
              <UserPlus className="size-4" />
              {isPending ? "Wird angelegt…" : "Benutzer anlegen"}
            </Button>
          </form>

          {created && (
            <div className="mt-4 rounded-lg border border-green-600/30 bg-green-50 p-4 text-sm dark:bg-green-950/30">
              <p className="font-medium text-green-800 dark:text-green-300">
                Benutzer „{created.email}" angelegt.
              </p>
              <p className="mt-1 text-green-700/80 dark:text-green-400/80">
                Gib dieses Passwort einmalig weiter — es wird nicht erneut
                angezeigt.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm tracking-wide">
                  {created.password}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyPassword}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Kopiert" : "Kopieren"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name / E-Mail</TableHead>
                <TableHead className="w-28">Rolle</TableHead>
                <TableHead className="w-32">Angelegt</TableHead>
                <TableHead className="w-24 text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">
                        {user.name || "—"}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (du)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          user.role === "ADMIN"
                            ? "inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                            : "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ResetPasswordDialog
                          userId={user.id}
                          userLabel={user.name || user.email}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-foreground"
                              aria-label="Passwort zurücksetzen"
                            >
                              <KeyRound className="size-4" />
                            </Button>
                          }
                        />
                        {!isSelf && (
                          <DeleteUserDialog
                            userId={user.id}
                            userLabel={user.name || user.email}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-destructive"
                                aria-label="Benutzer löschen"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
