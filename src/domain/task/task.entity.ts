export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  estimatedCostCents: number | null;
  currency: string;
  plannedStart: Date | null;
  plannedEnd: Date | null;
  deadline: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  projectId: string;
  locationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
