import { can } from "@/lib/auth/permissions";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { readStoredFile } from "@/lib/storage";

/**
 * Serves a private lesson resource only to admins and learners enrolled in
 * that course. The real file location is never exposed.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/files/[id]">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return new Response("Please log in.", { status: 401 });

  const [row] = await db
    .select({ key: schema.media.key, mime: schema.media.mimeType, name: schema.media.originalName, label: schema.lessonResources.label, allowDownload: schema.lessonResources.allowDownload, courseId: schema.lessons.courseId })
    .from(schema.lessonResources)
    .innerJoin(schema.media, eq(schema.media.id, schema.lessonResources.mediaId))
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonResources.lessonId))
    .where(eq(schema.lessonResources.id, id))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });

  // Team members who manage courses can open any course file; everyone else needs an enrolment.
  if (!can(user.staffRole, "courses")) {
    const [enr] = await db
      .select({ id: schema.enrollments.id })
      .from(schema.enrollments)
      .where(and(eq(schema.enrollments.courseId, row.courseId), eq(schema.enrollments.userId, user.id)))
      .limit(1);
    if (!enr) return new Response("You do not have access to this file.", { status: 403 });
  }

  try {
    const file = await readStoredFile(row.key);
    const download = new URL(req.url).searchParams.get("download") === "1" && row.allowDownload;
    const safeName = row.name.replace(/[^\w.\- ]+/g, "_");
    const headers: Record<string, string> = {
      "Content-Type": row.mime,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
      // Even if a file contained script, the browser runs it in a locked-down sandbox.
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      "Cross-Origin-Resource-Policy": "same-origin",
    };
    // Byte ranges let audio players seek and resume without downloading the whole file again.
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
    if (range && (range[1] || range[2])) {
      const size = file.size;
      let start = range[1] ? Number(range[1]) : size - Number(range[2]);
      let end = range[1] && range[2] ? Number(range[2]) : size - 1;
      start = Math.max(0, start);
      end = Math.min(end, size - 1);
      if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      return new Response(new Uint8Array(file.data.subarray(start, end + 1)), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
      });
    }
    return new Response(new Uint8Array(file.data), { headers: { ...headers, "Content-Length": String(file.size) } });
  } catch {
    return new Response("File missing", { status: 404 });
  }
}
