import { Lock } from "lucide-react";
import type { PredecessorLink } from "@/domain/task/dependency";
import { countBlockingPredecessors } from "@/domain/task/dependency";

export function TaskBlockedBadge({
  predecessors,
}: {
  predecessors: PredecessorLink[];
}) {
  const count = countBlockingPredecessors(predecessors);
  if (count === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
      title={`Blockiert von ${count} Vorgang${count === 1 ? "" : "en"}`}
    >
      <Lock className="size-3" />
      Blockiert von {count}
    </span>
  );
}
