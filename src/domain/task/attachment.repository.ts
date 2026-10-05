import type {
  TaskAttachmentBlob,
  TaskAttachmentMeta,
} from "./attachment.entity";

export interface NewAttachment {
  taskId: string;
  filename: string;
  mimeType: string;
  data: Uint8Array;
}

/**
 * Port (domain boundary) for task attachments. The Prisma implementation keeps
 * the binary payload out of list queries — only `getBlob` loads it.
 */
export interface AttachmentRepository {
  listByTask(taskId: string): Promise<TaskAttachmentMeta[]>;
  add(data: NewAttachment): Promise<TaskAttachmentMeta>;
  getBlob(id: string): Promise<TaskAttachmentBlob | null>;
  delete(id: string): Promise<void>;
}
