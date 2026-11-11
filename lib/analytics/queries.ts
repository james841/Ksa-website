import "server-only";
import { and, desc, gte, isNotNull, lt, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/*
 * The questions the traffic page asks the database.
 *
 * Two words are used carefully throughout:
 *   visits   = pages opened
 *   visitors = different people, counted once a day each (see the visitor hash)
 * A "session" is one arrival: the first page somebody opens after half an hour
 * of being away.
 */

const v = schema.pageViews;

export type Range = { days: number; label: string };
export const RANGES: Record<string, Range> = {
  today: { days: 1, label: "Today" },
  "7d": { days: 7, label: "Last 7 days" },
  "30d": { days: 30, label: "Last 30 days" },
  "90d": { days: 90, label: "Last 90 days" },
};

const since = (days: number) => {
  const d = new Date();
  if (days === 1) d.setHours(0, 0, 0, 0);
  else d.setTime(d.getTime() - days * 24 * 60 * 60 * 1000);
  return d;
};

/** How many different people have been on the site in the last few minutes. */
export async function liveNow(minutes = 5) {
  const [row] = await db
    .select({
      people: sql<number>`count(distinct ${v.visitor})::int`,
      pages: sql<number>`count(*)::int`,
    })
    .from(v)
    .where(gte(v.createdAt, new Date(Date.now() - minutes * 60_000)));
  return { people: row?.people ?? 0, pages: row?.pages ?? 0 };
}

/** What those people are reading right now. */
export async function livePages(minutes = 5, limit = 6) {
  return db
    .select({ path: v.path, title: v.title, people: sql<number>`count(distinct ${v.visitor})::int` })
    .from(v)
    .where(gte(v.createdAt, new Date(Date.now() - minutes * 60_000)))
    .groupBy(v.path, v.title)
    .orderBy(desc(sql`count(distinct ${v.visitor})`))
    .limit(limit);
}

/** The headline numbers for a range, with the change against the range before it. */
export async function totals(days: number) {
  const from = since(days);
  const prevFrom = new Date(from.getTime() - (Date.now() - from.getTime()));

  const shape = {
    visits: sql<number>`count(*)::int`,
    visitors: sql<number>`count(distinct ${v.visitor})::int`,
    sessions: sql<number>`count(*) filter (where ${v.isEntry})::int`,
    avgSeconds: sql<number>`coalesce(round(avg(${v.seconds}) filter (where ${v.seconds} is not null)), 0)::int`,
  };

  const [now] = await db.select(shape).from(v).where(gte(v.createdAt, from));
  const [before] = await db.select(shape).from(v).where(and(gte(v.createdAt, prevFrom), lt(v.createdAt, from)));

  // Pages per arrival says whether people look around or leave after one page.
  const perSession = now.sessions ? Math.round((now.visits / now.sessions) * 10) / 10 : 0;
  const change = (a: number, b: number) => (b === 0 ? (a === 0 ? 0 : 100) : Math.round(((a - b) / b) * 100));

  return {
    ...now,
    perSession,
    change: {
      visits: change(now.visits, before.visits),
      visitors: change(now.visitors, before.visitors),
      sessions: change(now.sessions, before.sessions),
    },
  };
}

/** Visits and visitors per day, for the chart. */
export async function daily(days: number) {
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${v.createdAt}), 'YYYY-MM-DD')`,
      visits: sql<number>`count(*)::int`,
      visitors: sql<number>`count(distinct ${v.visitor})::int`,
    })
    .from(v)
    .where(gte(v.createdAt, since(days)))
    .groupBy(sql`date_trunc('day', ${v.createdAt})`)
    .orderBy(sql`date_trunc('day', ${v.createdAt})`);

  // Fill the quiet days, so a gap reads as zero rather than disappearing.
  const out: Array<{ day: string; visits: number; visitors: number }> = [];
  const start = since(days);
  for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    out.push(rows.find((r) => r.day === key) ?? { day: key, visits: 0, visitors: 0 });
  }
  return out;
}

/** Where the arrivals came from: by channel, and by the named source inside it. */
export async function sources(days: number) {
  const from = since(days);
  const byChannel = await db
    .select({ channel: v.channel, visitors: sql<number>`count(distinct ${v.visitor})::int`, visits: sql<number>`count(*)::int` })
    .from(v)
    .where(gte(v.createdAt, from))
    .groupBy(v.channel)
    .orderBy(desc(sql`count(distinct ${v.visitor})`));

  const bySource = await db
    .select({
      source: v.source,
      channel: v.channel,
      visitors: sql<number>`count(distinct ${v.visitor})::int`,
      visits: sql<number>`count(*)::int`,
    })
    .from(v)
    .where(and(gte(v.createdAt, from), isNotNull(v.source)))
    .groupBy(v.source, v.channel)
    .orderBy(desc(sql`count(distinct ${v.visitor})`))
    .limit(25);

  return { byChannel, bySource, social: bySource.filter((s) => s.channel === "social") };
}

export async function topPages(days: number, limit = 12) {
  return db
    .select({
      path: v.path,
      title: v.title,
      visits: sql<number>`count(*)::int`,
      visitors: sql<number>`count(distinct ${v.visitor})::int`,
      avgSeconds: sql<number>`coalesce(round(avg(${v.seconds}) filter (where ${v.seconds} is not null)), 0)::int`,
    })
    .from(v)
    .where(gte(v.createdAt, since(days)))
    .groupBy(v.path, v.title)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function devices(days: number) {
  return db
    .select({ device: v.device, visitors: sql<number>`count(distinct ${v.visitor})::int` })
    .from(v)
    .where(gte(v.createdAt, since(days)))
    .groupBy(v.device)
    .orderBy(desc(sql`count(distinct ${v.visitor})`));
}

export async function countries(days: number, limit = 10) {
  return db
    .select({ country: v.country, visitors: sql<number>`count(distinct ${v.visitor})::int` })
    .from(v)
    .where(and(gte(v.createdAt, since(days)), isNotNull(v.country)))
    .groupBy(v.country)
    .orderBy(desc(sql`count(distinct ${v.visitor})`))
    .limit(limit);
}

/** Named campaigns, so a push on one platform can be measured on its own. */
export async function campaigns(days: number, limit = 12) {
  return db
    .select({
      campaign: v.utmCampaign,
      source: v.utmSource,
      visitors: sql<number>`count(distinct ${v.visitor})::int`,
      visits: sql<number>`count(*)::int`,
    })
    .from(v)
    .where(and(gte(v.createdAt, since(days)), isNotNull(v.utmCampaign)))
    .groupBy(v.utmCampaign, v.utmSource)
    .orderBy(desc(sql`count(distinct ${v.visitor})`))
    .limit(limit);
}

/** The first page people land on: what your links actually point at. */
export async function entryPages(days: number, limit = 8) {
  return db
    .select({ path: v.path, sessions: sql<number>`count(*)::int` })
    .from(v)
    .where(and(gte(v.createdAt, since(days)), sql`${v.isEntry}`))
    .groupBy(v.path)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}
