export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PERSONS = ["KARL", "FELIX", "GEMEINSAM"] as const;

export type TaskPerson = (typeof TASK_PERSONS)[number];

export interface Task {
  id: string;
  /** Optimistic-concurrency version; bumped on every write. */
  version: number;
  title: string;
  description: string | null;
  procurementSource: string | null;
  person: TaskPerson | null;
  status: TaskStatus;
  estimatedCostCents: number | null;
  currency: string;
  plannedStart: Date | null;
  plannedEnd: Date | null;
  deadline: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  /** When the task was moved to DONE (null while not done). */
  completedAt: Date | null;
  projectId: string;
  locationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
