"use server";

import { revalidatePath } from "next/cache";
import { projectService } from "@/container";
import { toActionError, type ActionResult } from "./result";

export interface CreateProjectActionInput {
  name: string;
  description?: string | null;
  parentId?: string | null;
  locationIds?: string[];
}

export async function createProjectAction(
  input: CreateProjectActionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const project = await projectService.create({
      name: input.name,
      description: input.description ?? null,
      parentId: input.parentId ?? null,
      locationIds: input.locationIds ?? [],
    });
    revalidatePath("/", "layout");
    return { ok: true, data: { id: project.id } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateProjectAction(
  id: string,
  input: CreateProjectActionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const project = await projectService.update(id, {
      name: input.name,
      description: input.description ?? null,
      parentId: input.parentId ?? null,
      locationIds: input.locationIds ?? [],
    });
    revalidatePath("/", "layout");
    return { ok: true, data: { id: project.id } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  try {
    await projectService.delete(id);
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return toActionError(e);
  }
}
