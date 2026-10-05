"use server";

import { revalidatePath } from "next/cache";
import { taskService } from "@/container";
import type { TaskPerson, TaskStatus } from "@/domain/task/task.entity";
import { toActionError, type ActionResult } from "./result";

export interface CreateTaskActionInput {
  title: string;
  projectId: string;
  description?: string | null;
  procurementSource?: string | null;
  person?: TaskPerson | null;
  status?: TaskStatus;
  estimatedCostCents?: number | null;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  deadline?: string | null;
}

export interface UpdateTaskActionInput extends CreateTaskActionInput {
  /** Optimistic-concurrency version the client last read (from Task.version). */
  version?: number;
}

export async function createTaskAction(
  input: CreateTaskActionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const task = await taskService.create({
      title: input.title,
      projectId: input.projectId,
      description: input.description ?? null,
      procurementSource: input.procurementSource ?? null,
      person: input.person ?? null,
      status: input.status,
      estimatedCostCents: input.estimatedCostCents ?? null,
      plannedStart: input.plannedStart ? new Date(input.plannedStart) : null,
      plannedEnd: input.plannedEnd ? new Date(input.plannedEnd) : null,
      deadline: input.deadline ? new Date(input.deadline) : null,
    });
    revalidatePath(`/projects/${input.projectId}`);
    return { ok: true, data: { id: task.id } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateTaskAction(
  id: string,
  input: UpdateTaskActionInput,
): Promise<ActionResult<{ id: string; version: number }>> {
  try {
    const task = await taskService.update(id, {
      title: input.title,
      projectId: input.projectId,
      description: input.description ?? null,
      procurementSource: input.procurementSource ?? null,
      person: input.person ?? null,
      status: input.status,
      estimatedCostCents: input.estimatedCostCents ?? null,
      plannedStart: input.plannedStart ? new Date(input.plannedStart) : null,
      plannedEnd: input.plannedEnd ? new Date(input.plannedEnd) : null,
      deadline: input.deadline ? new Date(input.deadline) : null,
      version: input.version,
    });
    revalidatePath(`/projects/${input.projectId}`);
    return { ok: true, data: { id: task.id, version: task.version } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateTaskStatusAction(
  id: string,
  status: TaskStatus,
  projectId: string,
  version?: number,
): Promise<ActionResult<{ id: string }>> {
  try {
    const task = await taskService.update(id, { status, version });
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, data: { id: task.id } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteTaskAction(
  id: string,
  projectId: string,
): Promise<ActionResult> {
  try {
    await taskService.delete(id);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return toActionError(e);
  }
}
