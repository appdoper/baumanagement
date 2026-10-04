"use server";

import { revalidatePath } from "next/cache";
import { projectService } from "@/container";
import { toActionError, type ActionResult } from "./result";

export interface CreateProjectActionInput {
  name: string;
  description?: string | null;
  parentId?: string | null;
}

export async function createProjectAction(
  input: CreateProjectActionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const project = await projectService.create({
      name: input.name,
      description: input.description ?? null,
      parentId: input.parentId ?? null,
    });
    revalidatePath("/", "layout");
    return { ok: true, data: { id: project.id } };
  } catch (e) {
    return toActionError(e);
  }
}
