import "server-only";
import { requirePermission } from "@/lib/auth/session";
import { storeImage } from "@/lib/uploads";

/**
 * Every admin server action must start with this, naming its section, e.g. guard("courses").
 * It redirects anyone who is not on the team or whose role cannot use that section.
 */
export const guard = requirePermission;

export const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};
export const optional = (fd: FormData, key: string) => str(fd, key) || null;
export const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";
export const int = (fd: FormData, key: string) => {
  const n = Number.parseInt(str(fd, key), 10);
  return Number.isFinite(n) ? n : null;
};

/**
 * Reads an <ImageField>: a new upload wins, otherwise the kept current value
 * (empty when the admin pressed "Remove image").
 */
export async function imageFromForm(fd: FormData, name: string, adminId: string, maxWidth = 1600) {
  const file = fd.get(name);
  if (file instanceof File && file.size > 0) {
    const saved = await storeImage(file, adminId, maxWidth);
    return saved.url;
  }
  return str(fd, `${name}_current`) || null;
}

export const errMsg = (e: unknown, fallback = "Something went wrong. Please try again.") => {
  const cause = (e as { cause?: { code?: string; message?: string } })?.cause;
  if (cause?.code === "23505" || /duplicate key/i.test(cause?.message ?? "")) return "That web address is already used. Choose a different one.";
  if (e instanceof Error) {
    if (/duplicate key|unique/i.test(e.message)) return "That web address is already used. Choose a different one.";
    if (e.message.startsWith("Please") || e.message.startsWith("Images") || e.message.startsWith("Files") || e.message.startsWith("That")) return e.message;
  }
  console.error("[admin]", e);
  return fallback;
};
