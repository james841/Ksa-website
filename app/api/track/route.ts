import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { classify, deviceOf, looksLikeBot } from "@/lib/analytics/sources";
import { getCurrentUser } from "@/lib/auth/session";
import { siteUrl } from "@/lib/utils";

/*
 * Records one visit.
 *
 * Privacy, on purpose:
 *   - no cookie is set for analytics, so no banner is owed for this part
 *   - the IP address is never written down
 *   - "visitor" is sha256(ip + browser + a salt that changes at midnight), cut
 *     short. Same person, same day, same hash. Tomorrow, a different one, and
 *     nothing can be worked backwards from it.
 *
 * It always answers 204, whatever happens. A counter must never be the reason a
 * page misbehaves.
 */

const MAX_PATH = 300;

function dailySalt() {
  const day = new Date().toISOString().slice(0, 10);
  return `${day}:${process.env.ANALYTICS_SALT ?? process.env.AUTH_SECRET ?? "ksa"}`;
}

function visitorHash(ip: string, ua: string | null) {
  return createHash("sha256").update(`${ip}|${ua ?? ""}|${dailySalt()}`).digest("hex").slice(0, 32);
}

export async function POST(req: Request) {
  try {
    const h = await headers();
    const ua = h.get("user-agent");
    if (looksLikeBot(ua)) return new Response(null, { status: 204 });

    const body = (await req.json()) as {
      path?: string;
      title?: string;
      referrer?: string;
      utm?: { source?: string; medium?: string; campaign?: string };
      seconds?: number;
      id?: string;
    };

    const path = (body.path ?? "/").slice(0, MAX_PATH);
    // The admin looking at its own numbers would make them useless.
    if (path.startsWith("/admin")) return new Response(null, { status: 204 });

    const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "0.0.0.0").trim();
    const visitor = visitorHash(ip, ua);

    // A closing beat: the page says how long it was open. Update, do not add.
    if (body.id && typeof body.seconds === "number") {
      await db
        .update(schema.pageViews)
        .set({ seconds: Math.min(3600, Math.max(0, Math.round(body.seconds))) })
        .where(and(eq(schema.pageViews.id, body.id), eq(schema.pageViews.visitor, visitor)));
      return new Response(null, { status: 204 });
    }

    const selfHost = (() => {
      try {
        return new URL(siteUrl).hostname;
      } catch {
        return "localhost";
      }
    })();
    const { channel, source } = classify({
      referrer: body.referrer,
      utmSource: body.utm?.source,
      utmMedium: body.utm?.medium,
      selfHost,
    });

    // First page of this visit? True when nothing was recorded in the last half hour.
    const [recent] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.pageViews)
      .where(and(eq(schema.pageViews.visitor, visitor), gte(schema.pageViews.createdAt, new Date(Date.now() - 30 * 60_000))));

    const user = await getCurrentUser().catch(() => null);

    const [row] = await db
      .insert(schema.pageViews)
      .values({
        visitor,
        path,
        title: body.title?.slice(0, 200) ?? null,
        channel: channel === "internal" ? "direct" : channel,
        source: channel === "internal" ? "Direct" : source,
        referrer: body.referrer?.slice(0, 500) ?? null,
        utmSource: body.utm?.source?.slice(0, 100) ?? null,
        utmMedium: body.utm?.medium?.slice(0, 100) ?? null,
        utmCampaign: body.utm?.campaign?.slice(0, 100) ?? null,
        device: deviceOf(ua),
        // Vercel adds this header itself; elsewhere it is simply unknown.
        country: h.get("x-vercel-ip-country")?.slice(0, 2) ?? null,
        isEntry: (recent?.n ?? 0) === 0,
        userId: user?.id ?? null,
      })
      .returning({ id: schema.pageViews.id });

    return Response.json({ id: row.id }, { status: 200 });
  } catch (e) {
    console.error("[track]", e instanceof Error ? e.message : e);
    return new Response(null, { status: 204 });
  }
}
