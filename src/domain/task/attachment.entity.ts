/** Attachment metadata — everything except the binary payload. */
export interface TaskAttachmentMeta {
  id: string;
  taskId: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

/** Attachment metadata plus the raw bytes — only loaded when streaming it. */
export interface TaskAttachmentBlob extends TaskAttachmentMeta {
  data: Uint8Array;
}
