"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { resetUserPasswordAction } from "@/app/actions/user.actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ResetPasswordDialog({
  userId,
  userLabel,
  trigger,
}: {
  userId: string;
  userLabel: string;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setPassword(null);
    setCopied(false);
  }

  function onConfirm() {
    startTransition(async () => {
      const res = await resetUserPasswordAction(userId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPassword(res.data.password);
      setCopied(false);
      router.refresh();
    });
  }

  async function copyPassword() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Passwort kopiert.");
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Don't let the generated password vanish by an accidental dismiss;
        // the result phase is closed only via the explicit "Fertig" button.
        if (!next && password) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        {password ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Passwort zurückgesetzt</AlertDialogTitle>
              <AlertDialogDescription>
                Gib „{userLabel}" dieses temporäre Passwort weiter. Es wird nicht
                erneut angezeigt — beim nächsten Login muss ein eigenes Passwort
                gesetzt werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-center font-mono text-base font-semibold tracking-wider">
                {password}
              </code>
              <Button type="button" variant="outline" onClick={copyPassword}>
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? "Kopiert" : "Kopieren"}
              </Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Fertig
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Passwort zurücksetzen?</AlertDialogTitle>
              <AlertDialogDescription>
                Für „{userLabel}" wird ein neues temporäres Passwort erzeugt. Das
                alte Passwort wird sofort ungültig.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              {/* AlertDialogAction is a plain button (no auto-close), so the
                  dialog stays open to reveal the generated password. */}
              <AlertDialogAction onClick={onConfirm} disabled={isPending}>
                {isPending ? "Wird zurückgesetzt…" : "Zurücksetzen"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
