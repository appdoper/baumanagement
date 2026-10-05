import type { TaskPerson } from "@/domain/task/task.entity";

export const PERSON_LABELS: Record<TaskPerson, string> = {
  KARL: "Karl",
  FELIX: "Felix",
  GEMEINSAM: "Gemeinsam",
};

const PERSON_CLASSES: Record<TaskPerson, string> = {
  KARL: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  FELIX: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  GEMEINSAM: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
};

export function PersonBadge({ person }: { person: TaskPerson }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PERSON_CLASSES[person]}`}
    >
      {PERSON_LABELS[person]}
    </span>
  );
}
