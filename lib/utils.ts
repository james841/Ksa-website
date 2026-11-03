export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function formatDate(d: Date | string | null | undefined, short = false) {
  if (!d) return "";
  return (short ? shortFmt : dateFmt).format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined, timeZone = "Africa/Lagos") {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(d));
}

export function initials(name: string) {
  return name
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function toInt(v: unknown, fallback = 0) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Turn a YouTube, Vimeo or other video link into an embeddable URL. */
export function toEmbedUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}?rel=0&modestbranding=1`;
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0]}?dnt=1`;
    return url;
  } catch {
    return null;
  }
}
