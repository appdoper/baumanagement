"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactElement,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Project } from "@/domain/project/project.entity";
import type { Location } from "@/domain/location/location.entity";
import {
  createProjectAction,
  updateProjectAction,
} from "@/app/actions/project.actions";
import { LocationPicker } from "./location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AUTOSAVE_DELAY_MS,
  AutoSaveStatus,
  type SaveState,
} from "@/components/shared/auto-save-status";

const NONE = "__none__";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich."),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProjectFormSheet({
  projects,
  project,
  locations = [],
  defaultParentId,
  trigger,
}: {
  projects: Project[];
  project?: Project;
  locations?: Location[];
  defaultParentId?: string | null;
  trigger: ReactElement;
}) {
  const isEdit = Boolean(project);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [locationIds, setLocationIds] = useState<string[]>(
    project?.locationIds ?? [],
  );

  const initialParent = project?.parentId ?? defaultParentId ?? null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    trigger: validateForm,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      parentId: initialParent ?? NONE,
    },
  });

  // Exclude the project itself from the parent options to avoid self-reference.
  const parentOptions = projects.filter((p) => p.id !== project?.id);

  // Base UI renders <Select.Value> from the raw value unless `items` maps
  // values → labels. Without it the trigger would show the ID or "__none__".
  const parentItems: Record<string, string> = {
    [NONE]: "Keines (Hauptprojekt)",
    ...Object.fromEntries(parentOptions.map((p) => [p.id, p.name])),
  };

  function buildPayload(values: FormValues, locIds: string[]) {
    return {
      name: values.name,
      description: values.description?.trim() ? values.description.trim() : null,
      parentId:
        values.parentId && values.parentId !== NONE ? values.parentId : null,
      locationIds: locIds,
    };
  }

  // --- Create mode: explicit submit. ---
  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await createProjectAction(buildPayload(values, locationIds));
      if (result.ok) {
        toast.success("Projekt erstellt.");
        reset({ name: "", description: "", parentId: NONE });
        setLocationIds([]);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  // --- Edit mode: debounced auto-save, no save button. ---
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The actual save, kept in a ref and refreshed every render. The scheduler
  // and the effects below can then stay STABLE across the re-renders that each
  // successful save causes (revalidation hands down a new `project` prop).
  // Without this the Standort effect would re-run after every save and schedule
  // another one — an infinite save loop.
  const saveRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    saveRef.current = async () => {
      if (!project) return;
      // Don't persist an invalid form (e.g. empty name); wait for a valid edit.
      if (!(await validateForm())) return;
      // One save in flight at a time; coalesce further changes into a re-run.
      if (savingRef.current) {
        pendingRef.current = true;
        return;
      }
      savingRef.current = true;
      setSaveState("saving");

      const result = await updateProjectAction(
        project.id,
        buildPayload(getValues(), locationIds),
      );

      savingRef.current = false;
      if (result.ok) {
        setSaveError(null);
        setSaveState("saved");
      } else {
        setSaveError(result.error);
        setSaveState("error");
      }

      if (pendingRef.current) {
        pendingRef.current = false;
        void saveRef.current();
      }
    };
  });

  // Stable debounced scheduler — always invokes the latest save closure.
  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void saveRef.current(), AUTOSAVE_DELAY_MS);
  }, []);

  // Auto-save on form field changes — only while the sheet is open in edit mode.
  useEffect(() => {
    if (!isEdit || !open) return;
    const sub = watch(() => scheduleSave());
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      sub.unsubscribe();
    };
  }, [isEdit, open, watch, scheduleSave]);

  // Auto-save on Standort changes (separate state); skip the initial value.
  const locationInitRef = useRef(true);
  useEffect(() => {
    if (!isEdit || !open) return;
    if (locationInitRef.current) {
      locationInitRef.current = false;
      return;
    }
    scheduleSave();
  }, [isEdit, open, locationIds, scheduleSave]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent className="gap-0 data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 pb-4">
          <SheetTitle>
            {isEdit ? "Projekt bearbeiten" : "Neues Projekt"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Passe Name, Beschreibung oder Einordnung des Projekts an."
              : "Lege ein Projekt oder Unterprojekt (WBS) an."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={
            isEdit
              ? (e) => {
                  // Enter triggers an immediate save instead of a create.
                  e.preventDefault();
                  void saveRef.current();
                }
              : handleSubmit(onSubmit)
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name *</Label>
              <Input id="project-name" {...register("name")} autoFocus />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Beschreibung</Label>
              <Textarea
                id="project-description"
                className="min-h-[150px]"
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-parent">Übergeordnetes Projekt</Label>
              <Select
                items={parentItems}
                defaultValue={initialParent ?? NONE}
                onValueChange={(v) => setValue("parentId", v ?? undefined)}
              >
                <SelectTrigger id="project-parent" className="w-full">
                  <SelectValue placeholder="Keines (Hauptprojekt)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Keines (Hauptprojekt)</SelectItem>
                  {parentOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Standorte</Label>
              <LocationPicker
                locations={locations}
                selectedIds={locationIds}
                onChange={setLocationIds}
              />
            </div>
          </div>

          <SheetFooter className="shrink-0 flex-row items-center justify-end gap-2 border-t">
            {isEdit ? (
              <AutoSaveStatus state={saveState} error={saveError} />
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Speichern…" : "Projekt erstellen"}
              </Button>
            )}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
