import "server-only";
import { mkdir, writeFile, readFile, unlink, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Where uploaded files live.
 *
 * Two drivers, same functions:
 *   • Local disk  - used on your computer (and any normal server).
 *   • Supabase Storage - used when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
 *
 * Hosts like Vercel do not keep files written to disk, so the website must use
 * Supabase Storage there. Nothing else in the code changes: public images are
 * still served through /media and private course files through /api/files, so a
 * private file is never reachable by URL alone.
 */

const SUPABASE_URL = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "ksa-files";

/** True when uploads go to Supabase Storage instead of the local disk. */
export const usingSupabaseStorage = Boolean(SUPABASE_URL && SUPABASE_KEY);

const ROOT = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.STORAGE_DIR || "storage");

function safeJoin(...parts: string[]) {
  const full = path.resolve(ROOT, ...parts);
  if (!full.startsWith(ROOT + path.sep)) throw new Error("Invalid storage path");
  return full;
}

/** Keys look like public/2026/11/uuid.webp or private/2026/11/uuid.pdf. */
function newKey(folder: "public" | "private", ext: string) {
  const now = new Date();
  return `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}${ext}`;
}

const objectUrl = (key: string) => `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
const authHeaders = { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY };

async function supabaseError(res: Response, what: string) {
  const body = await res.text().catch(() => "");
  return new Error(`Supabase Storage could not ${what} (${res.status}). ${body.slice(0, 300)}`);
}

export async function saveFile(folder: "public" | "private", ext: string, data: Buffer) {
  const key = newKey(folder, ext);
  if (usingSupabaseStorage) {
    const res = await fetch(objectUrl(key), {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/octet-stream", "cache-control": "max-age=31536000" },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw await supabaseError(res, "save the file");
    return key;
  }
  const full = safeJoin(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return key;
}

export async function readStoredFile(key: string) {
  if (usingSupabaseStorage) {
    const res = await fetch(objectUrl(key), { headers: authHeaders, cache: "no-store" });
    if (!res.ok) throw await supabaseError(res, "read the file");
    const data = Buffer.from(await res.arrayBuffer());
    const modified = res.headers.get("last-modified");
    return { data, size: data.length, mtime: modified ? new Date(modified) : new Date() };
  }
  const full = safeJoin(key);
  const [data, info] = await Promise.all([readFile(full), stat(full)]);
  return { data, size: info.size, mtime: info.mtime };
}

export async function deleteStoredFile(key: string) {
  if (usingSupabaseStorage) {
    const res = await fetch(objectUrl(key), { method: "DELETE", headers: authHeaders });
    // A file that is already gone is not a problem.
    if (!res.ok && res.status !== 404) console.error(`[storage] could not delete ${key} (${res.status})`);
    return;
  }
  try {
    await unlink(safeJoin(key));
  } catch {
    /* already gone */
  }
}
