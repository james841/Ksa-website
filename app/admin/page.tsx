import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, count, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { can, ROLE_INFO, type Section } from "@/lib/auth/permissions";
import { AlertsCard } from "@/components/admin/alerts-card";
import { generalAlertEmail } from "@/lib/notify";
import { Badge, EmptyState, Panel, StatCard } from "@/components/admin/ui";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ArrowRight, Plus } from "@/components/ui/icons";
import { now, nowMs } from "@/lib/now";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Dashboard" };

const DAY = 24 * 60 * 60 * 1000;

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const admin = await requirePermission("overview");
  const denied = (await searchParams).denied === "1";
  // Each team member only sees the parts of the dashboard their role can open.
  const c = (s: Section) => can(admin.staffRole, s);
  const since30 = new Date(nowMs() - 30 * DAY);
  const since7 = new Date(nowMs() - 7 * DAY);

  const [
    [me],
    generalEmail,
    [users],
    [newUsers],
    [quotesNew],
    [quotesOpen],
    [subs],
    [enrolled],
    upcoming,
    recentQuotes,
    followUps,
    signups,
    [lastCampaign],
  ] = await Promise.all([
    db.select({ notifyByEmail: schema.users.notifyByEmail }).from(schema.users).where(eq(schema.users.id, admin.id)).limit(1),
    generalAlertEmail(),
    db.select({ n: count() }).from(schema.users),
    db.select({ n: count() }).from(schema.users).where(gte(schema.users.createdAt, since7)),
    db.select({ n: count() }).from(schema.quoteRequests).where(eq(schema.quoteRequests.status, "new")),
    db.select({ n: count() }).from(schema.quoteRequests).where(eq(schema.quoteRequests.status, "in_progress")),
    db.select({ n: count() }).from(schema.emailSubscriptions).where(eq(schema.emailSubscriptions.status, "subscribed")),
    db.select({ n: count() }).from(schema.enrollments),
    db
      .select({
        id: schema.webinars.id,
        title: schema.webinars.title,
        startsAt: schema.webinars.startsAt,
        status: schema.webinars.status,
        meetingUrl: schema.webinars.meetingUrl,
        registered: sql<number>`(select count(*)::int from webinar_registrations r where r.webinar_id = "webinars"."id")`,
      })
      .from(schema.webinars)
      .where(and(gte(schema.webinars.startsAt, now()), sql`${schema.webinars.status} <> 'cancelled'`))
      .orderBy(asc(schema.webinars.startsAt))
      .limit(4),
    db
      .select({ id: schema.quoteRequests.id, name: schema.quoteRequests.name, service: schema.quoteRequests.service, status: schema.quoteRequests.status, createdAt: schema.quoteRequests.createdAt, country: schema.quoteRequests.country })
      .from(schema.quoteRequests)
      .orderBy(desc(schema.quoteRequests.createdAt))
      .limit(6),
    db
      .select({ id: schema.quoteRequests.id, name: schema.quoteRequests.name, followUpAt: schema.quoteRequests.followUpAt, reference: schema.quoteRequests.reference })
      .from(schema.quoteRequests)
      .where(and(isNotNull(schema.quoteRequests.followUpAt), lte(schema.quoteRequests.followUpAt, new Date(nowMs() + 2 * DAY)), sql`${schema.quoteRequests.status} <> 'closed'`))
      .orderBy(asc(schema.quoteRequests.followUpAt))
      .limit(5),
    db
      .select({ day: sql<string>`to_char(date_trunc('day', ${schema.users.createdAt}), 'YYYY-MM-DD')`, n: count() })
      .from(schema.users)
      .where(gte(schema.users.createdAt, since30))
      .groupBy(sql`1`),
    db.select().from(schema.emailCampaigns).orderBy(desc(schema.emailCampaigns.createdAt)).limit(1),
  ]);

  // 30 daily buckets for the sign-up chart.
  const byDay = new Map(signups.map((s) => [s.day, s.n]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(nowMs() - (29 - i) * DAY);
    const key = d.toISOString().slice(0, 10);
    return { key, n: byDay.get(key) ?? 0, label: formatDate(d, true) };
  });
  const peak = Math.max(1, ...days.map((d) => d.n));
  const total30 = days.reduce((a, d) => a + d.n, 0);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Lagos" }).format(now()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{formatDate(now())}</p>
          <h1 className="mt-1 text-[2rem] leading-tight sm:text-[2.4rem]">
            {greeting}, {admin.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted">
            Here is what needs your attention today. You are signed in as <strong className="font-semibold text-ink">{ROLE_INFO[admin.staffRole].label}</strong>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {c("webinars") ? (
            <Link href="/admin/webinars/new" className="btn btn-ghost btn-sm">
              <Plus size={16} /> Webinar
            </Link>
          ) : null}
          {c("campaigns") ? (
            <Link href="/admin/campaigns/new" className="btn btn-dark btn-sm">
              <Plus size={16} /> Email campaign
            </Link>
          ) : null}
        </div>
      </header>

      {denied ? (
        <p role="alert" className="rounded-2xl border border-line bg-white px-5 py-4 text-sm text-ink">
          Your role ({ROLE_INFO[admin.staffRole].label}) does not include that page. Ask a super admin if you need access.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {c("quotes") ? <StatCard tone="blue" label="New quote requests" value={quotesNew.n} hint={`${quotesOpen.n} in progress`} href="/admin/quotes?status=new" /> : null}
        {c("users") ? <StatCard label="Registered users" value={users.n} hint={`${newUsers.n} joined in the last 7 days`} href="/admin/users" /> : null}
        {c("subscribers") ? <StatCard label="Email subscribers" value={subs.n} hint="People who opted in to marketing" href="/admin/subscribers" /> : null}
        {c("courses") ? <StatCard tone="mist" label="Course enrolments" value={enrolled.n} hint="Across all courses" href="/admin/courses" /> : null}
      </div>

      <AlertsCard staffRole={admin.staffRole} on={me?.notifyByEmail ?? true} generalEmail={generalEmail} />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {c("users") ? (
        <Panel title="New accounts" description={`${total30} in the last 30 days`}>
          <div className="flex h-44 items-end gap-[3px]" role="img" aria-label={`Sign-ups per day over the last 30 days, ${total30} in total`}>
            {days.map((d) => (
              <div key={d.key} className="group relative flex h-full flex-1 items-end">
                <div
                  className="w-full rounded-t-[4px] bg-blue/85 transition-colors group-hover:bg-ink"
                  style={{ height: `${Math.max(3, (d.n / peak) * 100)}%`, opacity: d.n ? 1 : 0.18 }}
                />
                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white group-hover:block">
                  {d.label}: {d.n}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>{days[0].label}</span>
            <span>Today</span>
          </div>
        </Panel>
        ) : null}

        {c("quotes") ? (
        <Panel title="Follow-ups due" description="Quote requests with a reminder in the next 2 days">
          {followUps.length ? (
            <ul className="divide-y divide-line">
              {followUps.map((f) => (
                <li key={f.id}>
                  <Link href={`/admin/quotes/${f.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-blue">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{f.name}</span>
                      <span className="text-xs text-muted">{f.reference}</span>
                    </span>
                    <span className={`shrink-0 text-xs font-semibold ${f.followUpAt! < now() ? "text-danger" : "text-muted"}`}>{formatDateTime(f.followUpAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted">Nothing due. Set a follow-up date on any quote request to see it here.</p>
          )}
        </Panel>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {c("quotes") ? (
        <Panel
          title="Latest quote requests"
          pad={false}
          actions={
            <Link href="/admin/quotes" className="inline-flex items-center gap-1 text-sm font-semibold text-blue">
              All requests <ArrowRight size={16} />
            </Link>
          }
        >
          {recentQuotes.length ? (
            <ul className="divide-y divide-line">
              {recentQuotes.map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/quotes/${q.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-mist">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mist font-semibold text-ink">{q.name.slice(0, 1).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{q.name}</span>
                      <span className="block truncate text-sm text-muted">
                        {q.service} · {q.country}
                      </span>
                    </span>
                    <span className="hidden text-xs text-muted sm:block">{formatDate(q.createdAt, true)}</span>
                    <Badge value={q.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6">
              <EmptyState title="No requests yet" text="Requests sent from the website's quote form appear here, and an alert is emailed to you." />
            </div>
          )}
        </Panel>
        ) : null}

        <div className="space-y-6">
          {c("webinars") ? (
          <Panel
            title="Upcoming webinars"
            actions={
              <Link href="/admin/webinars" className="text-sm font-semibold text-blue">
                Manage
              </Link>
            }
          >
            {upcoming.length ? (
              <ul className="space-y-3">
                {upcoming.map((w) => (
                  <li key={w.id}>
                    <Link href={`/admin/webinars/${w.id}`} className="block rounded-xl border border-line p-3.5 hover:border-ink">
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-medium leading-snug">{w.title}</span>
                        <Badge value={w.status} />
                      </span>
                      <span className="mt-1.5 block text-xs text-muted">
                        {formatDateTime(w.startsAt)} · {w.registered} registered
                        {!w.meetingUrl ? <span className="ml-1 font-semibold text-danger">· No Zoom link yet</span> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                No upcoming webinars.{" "}
                <Link href="/admin/webinars/new" className="font-semibold text-blue">
                  Schedule one
                </Link>
              </p>
            )}
          </Panel>
          ) : null}

          {c("campaigns") ? (
          <Panel title="Last email campaign">
            {lastCampaign ? (
              <Link href={`/admin/campaigns/${lastCampaign.id}`} className="block">
                <span className="flex items-start justify-between gap-2">
                  <span className="font-medium">{lastCampaign.subject}</span>
                  <Badge value={lastCampaign.status} />
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {lastCampaign.sentAt ? `Sent ${formatDateTime(lastCampaign.sentAt)} · ${lastCampaign.sentCount} delivered to provider${lastCampaign.failedCount ? `, ${lastCampaign.failedCount} failed` : ""}` : `Created ${formatDate(lastCampaign.createdAt)}`}
                </span>
              </Link>
            ) : (
              <p className="text-sm text-muted">No campaigns yet.</p>
            )}
          </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
