"use server";

import { revalidatePath } from "next/cache";
import { taskService } from "@/container";
import type { TaskStatus } from "@/domain/task/task.entity";
import { toActionError, type ActionResult } from "./result";

export interface CreateTaskActionInput {
  title: string;
  projectId: string;
  description?: string | null;
  status?: TaskStatus;
  estimatedCostCents?: number | null;
  deadline?: string | null;
}

export async function createTaskAction(
  input: CreateTaskActionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const task = await taskService.create({
      title: input.title,
      projectId: input.projectId,
      description: input.description ?? null,
      status: input.status,
      estimatedCostCents: input.estimatedCostCents ?? null,
      deadline: input.deadline ? new Date(input.deadline) : null,
    });
    revalidatePath(`/projects/${input.projectId}`);
    return { ok: true, data: { id: task.id } };
  } catch (e) {
    return toActionError(e);
  }
}
