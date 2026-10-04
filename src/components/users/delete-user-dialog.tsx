"use client";

import { useState, useTransition, type ReactElement } from "react";
import { toast } from "sonner";
import { deleteUserAction } from "@/app/actions/user.actions";
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

export function DeleteUserDialog({
  userId,
  userLabel,
  trigger,
}: {
  userId: string;
  userLabel: string;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const res = await deleteUserAction(userId);
      if (res.ok) {
        toast.success("Benutzer gelöscht.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            „{userLabel}" verliert den Zugang. Zugewiesene Vorgänge bleiben
            erhalten (ohne Zuständigen). Das kann nicht rückgängig gemacht
            werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Löschen…" : "Löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
