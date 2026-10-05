"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Location } from "@/domain/location/location.entity";
import {
  createLocationAction,
  deleteLocationAction,
} from "@/app/actions/location.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function LocationManager({
  locations,
  trigger,
}: {
  locations: Location[];
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function addNew() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await createLocationAction(name);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setNewName("");
      toast.success("Standort angelegt.");
      router.refresh();
    });
  }

  function remove(id: string) {
    setPendingDelete(id);
    startTransition(async () => {
      const res = await deleteLocationAction(id);
      setPendingDelete(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Standort gelöscht.");
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent className="gap-0 data-[side=right]:sm:max-w-md">
        <SheetHeader className="shrink-0 pb-4">
          <SheetTitle>Standorte verwalten</SheetTitle>
          <SheetDescription>
            Lege Standorte an oder entferne sie. Beim Löschen wird der Standort
            von allen Projekten entfernt.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Neuer Standort"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNew();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addNew}
              disabled={isPending || !newName.trim()}
            >
              <Plus className="size-4" />
              Anlegen
            </Button>
          </div>

          {locations.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              Noch keine Standorte.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {locations.map((loc) => (
                <li
                  key={loc.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                >
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{loc.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Standort „${loc.name}“ löschen`}
                    disabled={pendingDelete === loc.id}
                    onClick={() => remove(loc.id)}
                  >
                    {pendingDelete === loc.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
