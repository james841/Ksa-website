import { getWebinarBySlug } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/utils";

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

export async function GET(_req: Request, ctx: RouteContext<"/api/webinars/[slug]/ics">) {
  const { slug } = await ctx.params;
  const w = await getWebinarBySlug(slug);
  if (!w) return new Response("Not found", { status: 404 });
  const end = w.endsAt ?? new Date(w.startsAt.getTime() + 3600_000);
  const url = absoluteUrl(`/webinars/${w.slug}`);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Knowledge Space Academy//Webinars//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${w.id}@knowledgespaceacademy`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(w.startsAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(w.title)}`,
    `DESCRIPTION:${esc(`${w.summary}\n\nJoining details are in your KSA dashboard: ${absoluteUrl("/dashboard/webinars")}`)}`,
    `URL:${url}`,
    "LOCATION:Online (Zoom)",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(body, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${w.slug}.ics"` },
  });
}
