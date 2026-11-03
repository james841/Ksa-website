import { readStoredFile } from "@/lib/storage";

/** Serves public images uploaded in the admin (already compressed to WebP on upload). */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path } = await ctx.params;
  const key = `public/${path.join("/")}`;
  if (path.some((p) => p === ".." || p.includes("\\") || p.includes("\0")) || !/\.webp$/.test(key)) return new Response("Bad request", { status: 400 });
  try {
    const file = await readStoredFile(key);
    return new Response(new Uint8Array(file.data), {
      headers: {
        "Content-Type": key.endsWith(".webp") ? "image/webp" : "application/octet-stream",
        "Content-Length": String(file.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
