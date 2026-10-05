"use server";

import { revalidatePath } from "next/cache";
import { attachmentService } from "@/container";
import type { TaskAttachmentMeta } from "@/domain/task/attachment.entity";
import { ValidationError } from "@/domain/shared/errors";
import { toActionError, type ActionResult } from "./result";

export async function listAttachmentsAction(
  taskId: string,
): Promise<ActionResult<TaskAttachmentMeta[]>> {
  try {
    const items = await attachmentService.listForTask(taskId);
    return { ok: true, data: items };
  } catch (e) {
    return toActionError(e);
  }
}

export async function uploadAttachmentAction(
  taskId: string,
  projectId: string,
  formData: FormData,
): Promise<ActionResult<TaskAttachmentMeta>> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("Keine Datei übermittelt.");
    }
    const data = new Uint8Array(await file.arrayBuffer());
    const meta = await attachmentService.add({
      taskId,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      data,
    });
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, data: meta };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteAttachmentAction(
  id: string,
  projectId: string,
): Promise<ActionResult> {
  try {
    await attachmentService.delete(id);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return toActionError(e);
  }
}
