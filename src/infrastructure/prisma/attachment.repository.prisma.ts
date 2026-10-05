import type {
  TaskAttachmentBlob,
  TaskAttachmentMeta,
} from "@/domain/task/attachment.entity";
import type {
  AttachmentRepository,
  NewAttachment,
} from "@/domain/task/attachment.repository";
import { prisma } from "./client";
import { toAttachmentMeta } from "./mappers";

// Everything but the binary payload — reused so list queries never load bytes.
const META_SELECT = {
  id: true,
  taskId: true,
  filename: true,
  mimeType: true,
  size: true,
  createdAt: true,
} as const;

export class PrismaAttachmentRepository implements AttachmentRepository {
  async listByTask(taskId: string): Promise<TaskAttachmentMeta[]> {
    const rows = await prisma.taskAttachment.findMany({
      where: { taskId },
      select: META_SELECT,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toAttachmentMeta);
  }

  async add(data: NewAttachment): Promise<TaskAttachmentMeta> {
    const row = await prisma.taskAttachment.create({
      data: {
        taskId: data.taskId,
        filename: data.filename,
        mimeType: data.mimeType,
        size: data.data.byteLength,
        data: Buffer.from(data.data),
      },
      select: META_SELECT,
    });
    return toAttachmentMeta(row);
  }

  async getBlob(id: string): Promise<TaskAttachmentBlob | null> {
    const row = await prisma.taskAttachment.findUnique({ where: { id } });
    if (!row) return null;
    return {
      ...toAttachmentMeta(row),
      data: row.data,
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.taskAttachment.delete({ where: { id } });
  }
}
