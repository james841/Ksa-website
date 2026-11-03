/**
 * Copies everything in the local `storage` folder up to Supabase Storage,
 * keeping the same file names, so uploads made before the move still open.
 *
 *   npm run storage:upload           (list what would be sent)
 *   npm run storage:upload -- --go   (actually send it)
 *
 * Needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and (optionally)
 * SUPABASE_STORAGE_BUCKET in .env. Safe to run twice: files are replaced.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), process.env.STORAGE_DIR || "storage");
const SUPABASE_URL = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "ksa-files";
const GO = process.argv.includes("--go");

const TYPES: Record<string, string> = {
  ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".avif": "image/avif",
  ".pdf": "application/pdf", ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain", ".csv": "text/csv", ".zip": "application/zip",
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg",
};

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile()) yield full;
  }
}

async function main() {
  if (!SUPABASE_URL || !KEY) {
    console.log("✗ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be in .env first.");
    process.exit(1);
  }
  try {
    await stat(ROOT);
  } catch {
    console.log(`Nothing to send: there is no "${path.relative(process.cwd(), ROOT) || "storage"}" folder.`);
    return;
  }

  const files: string[] = [];
  for await (const f of walk(ROOT)) files.push(f);
  if (!files.length) {
    console.log("Nothing to send: the storage folder is empty.");
    return;
  }

  let sent = 0;
  let failed = 0;
  let bytes = 0;
  console.log(`${files.length} file(s) found in ${ROOT}`);
  console.log(GO ? `Sending to bucket "${BUCKET}"…\n` : `Dry run. Add -- --go to send them to bucket "${BUCKET}".\n`);

  for (const full of files) {
    const key = path.relative(ROOT, full).split(path.sep).join("/");
    const data = await readFile(full);
    bytes += data.length;
    if (!GO) {
      console.log(`  would send ${key} (${Math.max(1, Math.round(data.length / 1024))} KB)`);
      continue;
    }
    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        apikey: KEY,
        "Content-Type": TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream",
        "cache-control": "max-age=31536000",
        "x-upsert": "true",
      },
      body: new Uint8Array(data),
    });
    if (res.ok) {
      sent++;
      console.log(`  ✓ ${key}`);
    } else {
      failed++;
      console.log(`  ✗ ${key} — ${res.status} ${(await res.text().catch(() => "")).slice(0, 160)}`);
    }
  }

  const mb = (bytes / 1024 / 1024).toFixed(1);
  if (!GO) console.log(`\n${files.length} file(s), ${mb} MB in total. Run again with -- --go to send them.`);
  else console.log(`\nDone. ${sent} sent, ${failed} failed, ${mb} MB in total.`);
  if (failed) process.exitCode = 1;
}

main();
