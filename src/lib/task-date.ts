import type { Task } from "@/domain/task/task.entity";

/** A task is overdue when it has a past deadline and is not yet done. */
export function isOverdue(task: Pick<Task, "deadline" | "status">): boolean {
  if (!task.deadline || task.status === "DONE") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.deadline) < today;
}
