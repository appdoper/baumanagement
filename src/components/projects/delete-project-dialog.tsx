"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProjectAction } from "@/app/actions/project.actions";
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

export function DeleteProjectDialog({
  projectId,
  projectName,
  taskCount,
  childCount,
  trigger,
}: {
  projectId: string;
  projectName: string;
  taskCount: number;
  childCount: number;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasChildren = taskCount > 0 || childCount > 0;

  function onConfirm() {
    startTransition(async () => {
      const res = await deleteProjectAction(projectId);
      if (res.ok) {
        toast.success("Projekt gelöscht.");
        setOpen(false);
        router.push("/");
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
          <AlertDialogTitle>Projekt löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasChildren ? (
              <>
                „{projectName}" enthält{" "}
                {childCount > 0 && (
                  <strong>
                    {childCount} Unterprojekt{childCount === 1 ? "" : "e"}
                  </strong>
                )}
                {childCount > 0 && taskCount > 0 && " und "}
                {taskCount > 0 && (
                  <strong>
                    {taskCount} Vorgang{taskCount === 1 ? "" : "e"}
                  </strong>
                )}
                . Diese werden <strong>ebenfalls dauerhaft gelöscht</strong>.
                Das kann nicht rückgängig gemacht werden.
              </>
            ) : (
              <>
                „{projectName}" wird dauerhaft gelöscht. Das kann nicht
                rückgängig gemacht werden.
              </>
            )}
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
