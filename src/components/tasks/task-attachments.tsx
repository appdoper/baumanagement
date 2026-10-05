"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Download, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { TaskAttachmentMeta } from "@/domain/task/attachment.entity";
import {
  deleteAttachmentAction,
  listAttachmentsAction,
  uploadAttachmentAction,
} from "@/app/actions/attachment.actions";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 30 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskAttachments({
  taskId,
  projectId,
}: {
  taskId: string;
  projectId: string;
}) {
  const [items, setItems] = useState<TaskAttachmentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, startUpload] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    listAttachmentsAction(taskId).then((res) => {
      if (!active) return;
      if (res.ok) setItems(res.data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [taskId]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error("Die Datei ist größer als 30 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startUpload(async () => {
      const res = await uploadAttachmentAction(taskId, projectId, formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setItems((prev) => [...prev, res.data]);
      toast.success("Anhang hochgeladen.");
    });
  }

  function onDelete(id: string) {
    setPendingDelete(id);
    startUpload(async () => {
      const res = await deleteAttachmentAction(id, projectId);
      setPendingDelete(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setItems((prev) => prev.filter((a) => a.id !== id));
      toast.success("Anhang gelöscht.");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="size-4" />
          Anhänge
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Hochladen
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx"
          onChange={onPick}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Bilder, PDFs und Dokumente, max. 30 MB pro Datei.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Wird geladen…</p>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Noch keine Anhänge.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2">
              <a
                href={`/api/attachments/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-2 text-sm hover:underline"
              >
                <Download className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.filename}</span>
              </a>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatBytes(item.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Anhang löschen"
                disabled={pendingDelete === item.id}
                onClick={() => onDelete(item.id)}
              >
                {pendingDelete === item.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
