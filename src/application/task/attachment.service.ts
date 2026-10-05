import type {
  TaskAttachmentBlob,
  TaskAttachmentMeta,
} from "@/domain/task/attachment.entity";
import type { AttachmentRepository } from "@/domain/task/attachment.repository";
import type { TaskRepository } from "@/domain/task/task.repository";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";

/** Max size per uploaded file (30 MB). */
export const MAX_ATTACHMENT_BYTES = 30 * 1024 * 1024;

/**
 * Allowed MIME types. Images and PDFs plus common office/text documents.
 * Anything else (executables, archives, …) is rejected.
 */
const ALLOWED_MIME_PREFIXES = ["image/"];
const ALLOWED_MIME_EXACT = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function isAllowedMime(mime: string): boolean {
  return (
    ALLOWED_MIME_EXACT.has(mime) ||
    ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix))
  );
}

/** Strip any path components and keep a reasonable filename length. */
function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "datei";
  const trimmed = base.trim().slice(0, 200);
  return trimmed || "datei";
}

export interface UploadAttachmentInput {
  taskId: string;
  filename: string;
  mimeType: string;
  data: Uint8Array;
}

export class AttachmentService {
  constructor(
    private readonly attachments: AttachmentRepository,
    private readonly tasks: TaskRepository,
  ) {}

  listForTask(taskId: string): Promise<TaskAttachmentMeta[]> {
    return this.attachments.listByTask(taskId);
  }

  async add(input: UploadAttachmentInput): Promise<TaskAttachmentMeta> {
    const task = await this.tasks.findById(input.taskId);
    if (!task) throw new NotFoundError("Task", input.taskId);

    if (input.data.byteLength === 0) {
      throw new ValidationError("Die Datei ist leer.");
    }
    if (input.data.byteLength > MAX_ATTACHMENT_BYTES) {
      throw new ValidationError("Die Datei ist größer als 30 MB.");
    }
    if (!isAllowedMime(input.mimeType)) {
      throw new ValidationError("Dieser Dateityp wird nicht unterstützt.");
    }

    return this.attachments.add({
      taskId: input.taskId,
      filename: sanitizeFilename(input.filename),
      mimeType: input.mimeType,
      data: input.data,
    });
  }

  getBlob(id: string): Promise<TaskAttachmentBlob | null> {
    return this.attachments.getBlob(id);
  }

  async delete(id: string): Promise<void> {
    await this.attachments.delete(id);
  }
}
