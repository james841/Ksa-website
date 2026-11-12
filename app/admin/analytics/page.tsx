import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { Panel, StatCard } from "@/components/admin/ui";
import { BarRow, DailyChart, LiveVisitors, ShowMore } from "@/components/admin/traffic";
import { campaigns, countries, daily, devices, entryPages, liveNow, livePages, RANGES, sources, topPages, totals } from "@/lib/analytics/queries";

/*
 * Private page: rendered fresh for each signed-in person, so there is nothing for
 * Next.js to prepare in advance.
 */
export const instant = false;

export const metadata: Metadata = { title: "Website traffic" };

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });
const CHANNEL_LABELS: Record<string, string> = {
  social: "Social media",
  search: "Search engines",
  email: "Email",
  referral: "Other websites",
  direct: "Direct or untracked",
};

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  // Only super admins and admins. Every other staff role is sent back.
  await requirePermission("analytics");
  const sp = await searchParams;
  const key = typeof sp.range === "string" && sp.range in RANGES ? sp.range : "30d";
  const { days, label } = RANGES[key];

  const [sum, days_, src, pages, dev, geo, camp, entries, now, top] = await Promise.all([
    totals(days),
    daily(days),
    sources(days),
    topPages(days),
    devices(days),
    countries(days),
    campaigns(days),
    entryPages(days),
    liveNow(),
    livePages(),
  ]);

  const visitorTotal = src.byChannel.reduce((a, c) => a + c.visitors, 0);
  const deviceTotal = dev.reduce((a, d) => a + d.visitors, 0);
  const geoTotal = geo.reduce((a, c) => a + c.visitors, 0);
  const socialTotal = src.social.reduce((a, s) => a + s.visitors, 0);
  const minutes = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);
  const arrow = (n: number) => (n > 0 ? `▲ ${n}%` : n < 0 ? `▼ ${Math.abs(n)}%` : "no change");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Website traffic</h1>
          <p className="mt-1.5 text-sm text-muted">
            The academy&rsquo;s own record, kept on this website. No cookies, no outside company, and it keeps counting for the many
            visitors whose browser blocks Google Analytics.
          </p>
        </div>
        {/* Scrolls sideways on a phone instead of making the whole page do it. */}
          <nav aria-label="Period" className="no-scrollbar -mx-4 flex max-w-full gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {Object.entries(RANGES).map(([k, r]) => (
            <Link key={k} href={`/admin/analytics?range=${k}`} className={`btn btn-sm shrink-0 ${k === key ? "btn-dark" : "btn-ghost bg-white"}`}>
              {r.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-4">
        <LiveVisitors initial={{ ...now, top }} />
        <StatCard label="Visitors" value={sum.visitors} hint={`${label} · ${arrow(sum.change.visitors)} on the period before`} tone="blue" />
        <StatCard label="Pages opened" value={sum.visits} hint={`${arrow(sum.change.visits)} · ${sum.perSession} pages per visit`} />
        <StatCard label="Average time on a page" value={minutes(sum.avgSeconds)} hint={`${sum.sessions} separate visits`} />
      </div>

      <Panel title={`Visits per day · ${label}`} className="mb-6">
        <DailyChart data={days_} />
      </Panel>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Where visitors come from" description="Grouped by the kind of source.">
          {src.byChannel.length ? (
            <ul className="divide-y divide-line">
              {src.byChannel.map((c) => (
                <BarRow key={c.channel} label={CHANNEL_LABELS[c.channel] ?? c.channel} value={c.visitors} total={visitorTotal} />
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Panel>

        <Panel
          title="Social media"
          description={socialTotal ? `${socialTotal} visitor${socialTotal === 1 ? "" : "s"} from social in this period.` : undefined}
        >
          {src.social.length ? (
            <ul className="divide-y divide-line">
              <ShowMore show={6} noun="platform">
                {src.social.map((s) => (
                  <BarRow key={s.source} label={s.source ?? "Unknown"} value={s.visitors} total={socialTotal} />
                ))}
              </ShowMore>
            </ul>
          ) : (
            <div className="text-sm text-muted">
              <p className="font-medium text-ink">Nothing from social yet in this period.</p>
              <p className="mt-2 leading-relaxed">
                Instagram and TikTok open links inside their own browser, which hides where the visit came from, so those arrivals
                land under &ldquo;Direct or untracked&rdquo;. Add <code className="rounded bg-mist px-1.5 py-0.5 text-xs">?utm_source=instagram&amp;utm_medium=social</code>{" "}
                to the end of the links you post and they will be named here every time.
              </p>
            </div>
          )}
        </Panel>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Named sources" description="Every source, social or not.">
          {src.bySource.length ? (
            <ul className="divide-y divide-line">
              <ShowMore show={6} noun="source">
                {src.bySource.map((s) => (
                  <BarRow key={`${s.source}-${s.channel}`} label={s.source ?? "Unknown"} value={s.visitors} total={visitorTotal} note={CHANNEL_LABELS[s.channel]} />
                ))}
              </ShowMore>
            </ul>
          ) : (
            <Empty />
          )}
        </Panel>

        <Panel title="Most read pages">
          {pages.length ? (
            <ul className="divide-y divide-line">
              <ShowMore show={6} noun="page">
              {pages.map((p) => (
                <li key={p.path} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{p.title ?? p.path}</span>
                    <span className="block truncate text-xs text-muted">{p.path}</span>
                  </span>
                  <span className="shrink-0 text-right text-muted">
                    <span className="block font-semibold text-ink">{p.visits}</span>
                    <span className="block text-xs">{p.avgSeconds ? minutes(p.avgSeconds) : "–"}</span>
                  </span>
                </li>
              ))}
              </ShowMore>
            </ul>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Devices">
          {dev.length ? (
            <ul className="divide-y divide-line">
              {dev.map((d) => (
                <BarRow key={d.device} label={d.device === "mobile" ? "Phone" : d.device === "tablet" ? "Tablet" : "Computer"} value={d.visitors} total={deviceTotal} />
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Panel>

        <Panel title="Countries">
          {geo.length ? (
            <ul className="divide-y divide-line">
              <ShowMore show={5} noun="country">
                {geo.map((c) => (
                  <BarRow key={c.country} label={safeCountry(c.country)} value={c.visitors} total={geoTotal} />
                ))}
              </ShowMore>
            </ul>
          ) : (
            <p className="text-sm text-muted">Countries are recorded by the hosting, and appear once the site is live on Vercel.</p>
          )}
        </Panel>

        <Panel title="Where people land first" description="The first page of a visit.">
          {entries.length ? (
            <ul className="divide-y divide-line">
              <ShowMore show={5} noun="page">
              {entries.map((e) => (
                <li key={e.path} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="truncate text-ink">{e.path}</span>
                  <span className="shrink-0 font-semibold text-ink">{e.sessions}</span>
                </li>
              ))}
              </ShowMore>
            </ul>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      {camp.length ? (
        <Panel title="Campaigns" description="Links you tagged with utm_campaign." className="mt-6">
          <ul className="divide-y divide-line">
            <ShowMore show={6} noun="campaign">
            {camp.map((c) => (
              <li key={`${c.campaign}-${c.source}`} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{c.campaign}</span>
                  <span className="block truncate text-xs text-muted">{c.source ?? "no source"}</span>
                </span>
                <span className="shrink-0 font-semibold text-ink">{c.visitors}</span>
              </li>
            ))}
            </ShowMore>
          </ul>
        </Panel>
      ) : null}

      <p className="mt-8 text-xs leading-relaxed text-muted">
        How the counting works: a <strong className="font-semibold text-ink">visit</strong> is one page opened, a{" "}
        <strong className="font-semibold text-ink">visitor</strong> is one person counted once per day. Nobody is followed from one
        day to the next: the website turns the address and browser into a one-way code with a salt that changes at midnight, so the
        same person tomorrow is simply a new visitor. No analytics cookie is set, no IP address is stored, obvious robots are ignored,
        and nothing you do inside this admin is counted.
      </p>
    </>
  );
}

function Empty() {
  return <p className="text-sm text-muted">Nothing recorded in this period yet.</p>;
}

function safeCountry(code: string | null) {
  if (!code) return "Unknown";
  try {
    return COUNTRY_NAMES.of(code) ?? code;
  } catch {
    return code;
  }
}
