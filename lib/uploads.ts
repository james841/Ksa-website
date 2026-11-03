import "server-only";
import sharp from "sharp";
import { db, schema } from "@/lib/db";
import { saveFile } from "@/lib/storage";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const DOC_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/zip": ".zip",
  // Audio versions of lessons: far lighter than video for learners on mobile data.
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/ogg": ".ogg",
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
// Must stay below serverActions.bodySizeLimit (25mb) in next.config.ts.
export const MAX_FILE_BYTES = 24 * 1024 * 1024;

/**
 * Saves an uploaded image as a compressed WebP (max 1600px wide, quality 78).
 * A 3MB phone photo usually ends up around 120-250KB with no visible loss.
 */
export async function storeImage(file: File, uploadedBy: string | null, maxWidth = 1600) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Please upload a JPG, PNG, WebP, AVIF or GIF image.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Images must be 8MB or smaller.");
  const input = Buffer.from(await file.arrayBuffer());
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  const key = await saveFile("public", ".webp", data);
  const [row] = await db
    .insert(schema.media)
    .values({
      key,
      originalName: file.name.slice(0, 200),
      mimeType: "image/webp",
      size: data.length,
      width: info.width,
      height: info.height,
      visibility: "public",
      uploadedBy,
    })
    .returning();
  return { ...row, url: `/media/${key.replace(/^public\//, "")}` };
}

/**
 * Checks the first bytes of the file, so a renamed .exe or .html cannot
 * be uploaded by pretending to be a PDF or Word file.
 */
function contentMatches(buf: Buffer, mime: string) {
  const starts = (...bytes: number[]) => bytes.every((b, i) => buf[i] === b);
  if (mime === "application/pdf") return buf.subarray(0, 5).toString("latin1") === "%PDF-";
  if (/openxmlformats|application\/zip/.test(mime)) return starts(0x50, 0x4b, 0x03, 0x04);
  if (/msword|ms-excel|ms-powerpoint/.test(mime)) return starts(0xd0, 0xcf, 0x11, 0xe0);
  if (mime.startsWith("image/")) return true; // decoded by sharp or checked below
  if (mime === "audio/mpeg") return buf.subarray(0, 3).toString("latin1") === "ID3" || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0);
  if (mime === "audio/mp4" || mime === "audio/x-m4a") return buf.subarray(4, 8).toString("latin1") === "ftyp";
  if (mime === "audio/ogg") return buf.subarray(0, 4).toString("latin1") === "OggS";
  if (mime === "text/plain" || mime === "text/csv") {
    const head = buf.subarray(0, 4096).toString("utf8").toLowerCase();
    return !buf.subarray(0, 4096).includes(0) && !/<script|<html|<!doctype|<svg|<iframe/.test(head);
  }
  return false;
}

/** Saves a private course resource. It can only be downloaded by entitled learners. */
export async function storePrivateFile(file: File, uploadedBy: string | null) {
  const ext = DOC_TYPES[file.type] ?? (IMAGE_TYPES.includes(file.type) ? "." + file.type.split("/")[1] : null);
  if (!ext) throw new Error("That file type is not supported. Upload a PDF, Office document, image, audio (MP3, M4A, OGG), CSV, TXT or ZIP.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Files must be 24MB or smaller. For longer material, link a video instead.");
  const data = Buffer.from(await file.arrayBuffer());
  if (!contentMatches(data, file.type)) throw new Error("That file's content does not match its type. Please re-save it and try again.");
  if (file.type.startsWith("image/")) {
    try {
      await sharp(data).metadata();
    } catch {
      throw new Error("That image could not be read. Please upload a JPG, PNG or WebP.");
    }
  }
  const key = await saveFile("private", ext, data);
  const [row] = await db
    .insert(schema.media)
    .values({ key, originalName: file.name.slice(0, 200), mimeType: file.type === "audio/x-m4a" ? "audio/mp4" : file.type, size: file.size, visibility: "private", uploadedBy })
    .returning();
  return row;
}
