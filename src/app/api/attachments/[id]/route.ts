import { attachmentService } from "@/container";

// Types that are safe to render inline in the browser. SVG is intentionally
// excluded (inline SVG can carry scripts) and served as a download instead.
const INLINE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/attachments/[id]">,
) {
  const { id } = await ctx.params;
  const blob = await attachmentService.getBlob(id);
  if (!blob) {
    return new Response("Not found", { status: 404 });
  }

  const disposition = INLINE_MIME.has(blob.mimeType) ? "inline" : "attachment";
  const encodedName = encodeURIComponent(blob.filename);

  // Fresh copy so the body is a plain ArrayBuffer-backed view.
  const body = new Uint8Array(blob.data);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": blob.mimeType,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodedName}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
