"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Location } from "@/domain/location/location.entity";
import { createLocationAction } from "@/app/actions/location.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function LocationPicker({
  locations,
  selectedIds,
  onChange,
}: {
  locations: Location[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [all, setAll] = useState<Location[]>(locations);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  }

  function addNew() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await createLocationAction(name);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setAll((prev) =>
        [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      onChange([...selectedIds, res.data.id]);
      setNewName("");
    });
  }

  return (
    <div className="space-y-3">
      {all.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {all.map((loc) => {
            const selected = selectedIds.includes(loc.id);
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => toggle(loc.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {selected && <Check className="size-3.5" />}
                {loc.name}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Noch keine Standorte. Lege unten den ersten an.
        </p>
      )}

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
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Hinzufügen
        </Button>
      </div>
    </div>
  );
}
