"use server";

import { revalidatePath } from "next/cache";
import { dependencyService } from "@/container";
import type { SupportedDependencyType } from "@/domain/task/dependency";
import { toActionError, type ActionResult } from "./result";

export interface AddDependencyActionInput {
  predecessorId: string;
  successorId: string;
  type: SupportedDependencyType;
  projectId: string;
}

export async function addDependencyAction(
  input: AddDependencyActionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const dependency = await dependencyService.addDependency({
      predecessorId: input.predecessorId,
      successorId: input.successorId,
      type: input.type,
    });
    revalidatePath(`/projects/${input.projectId}`);
    return { ok: true, data: { id: dependency.id } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function removeDependencyAction(
  dependencyId: string,
  projectId: string,
): Promise<ActionResult> {
  try {
    await dependencyService.removeDependency(dependencyId);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return toActionError(e);
  }
}
