import { and, eq, lte } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { db, schema } from "@/lib/db";
import { sendCampaign } from "@/lib/campaigns";

// 60 seconds is the limit on Vercel's free plan. On a paid plan you can raise
// this (up to 300) if a campaign ever has more recipients than one minute allows.
export const maxDuration = 60;

/**
 * Sends scheduled campaigns whose time has come. Call it every 5-15 minutes:
 *   Vercel Cron, a server crontab, or Windows Task Scheduler with
 *   curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yoursite.com/api/cron/campaigns
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ok = secret.length > 8 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return new Response("Unauthorised", { status: 401 });

  const due = await db
    .select({ id: schema.emailCampaigns.id })
    .from(schema.emailCampaigns)
    .where(and(eq(schema.emailCampaigns.status, "scheduled"), lte(schema.emailCampaigns.scheduledAt, new Date())));
  for (const c of due) await sendCampaign(c.id);
  return Response.json({ sent: due.length });
}
