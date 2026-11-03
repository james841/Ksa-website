import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, gte, ilike, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { quoteServiceOptions } from "@/lib/content";
import { Badge, EmptyState, FilterBar, PageHeader, Pager, Panel, Table } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import { Download } from "@/components/ui/icons";
import { nowMs } from "@/lib/now";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Quote requests" };
const PER_PAGE = 25;
const statuses = ["new", "in_progress", "responded", "closed"] as const;

export default async function QuotesPage({ searchParams }: PageProps<"/admin/quotes">) {
  await requirePermission("quotes");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" && (statuses as readonly string[]).includes(sp.status) ? (sp.status as (typeof statuses)[number]) : "";
  const service = typeof sp.service === "string" ? sp.service : "";
  const range = typeof sp.range === "string" ? sp.range : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: SQL[] = [];
  if (q) {
    const like = `%${q}%`;
    where.push(or(ilike(schema.quoteRequests.name, like), ilike(schema.quoteRequests.email, like), ilike(schema.quoteRequests.reference, like), ilike(schema.quoteRequests.promoCode, like))!);
  }
  if (status) where.push(eq(schema.quoteRequests.status, status));
  if (service) where.push(eq(schema.quoteRequests.service, service));
  if (range === "7" || range === "30" || range === "90") where.push(gte(schema.quoteRequests.createdAt, new Date(nowMs() - Number(range) * 864e5)));
  const cond = where.length ? and(...where) : undefined;

  const [rows, [{ n }], counts] = await Promise.all([
    db.select().from(schema.quoteRequests).where(cond).orderBy(desc(schema.quoteRequests.createdAt)).limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    db.select({ n: count() }).from(schema.quoteRequests).where(cond),
    db.select({ status: schema.quoteRequests.status, n: count() }).from(schema.quoteRequests).groupBy(schema.quoteRequests.status),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const link = (over: Record<string, string | number>) => {
    const p = new URLSearchParams();
    const merged = { q, status, service, range, page: 1, ...over };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "page" && v === 1)) p.set(k, String(v));
    const s = p.toString();
    return `/admin/quotes${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Quote requests"
        description="Every request from the website is saved here. Open one to read it, reply by email, add notes and track its status."
        actions={
           
          <a href="/api/admin/export/quotes" download className="btn btn-ghost btn-sm">
            <Download size={16} /> Export CSV
          </a>
        }
      />

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        <Link href={link({ status: "" })} className={`btn btn-sm ${!status ? "btn-dark" : "btn-ghost bg-white"}`}>
          All
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={link({ status: s })} className={`btn btn-sm capitalize ${status === s ? "btn-dark" : "btn-ghost bg-white"}`}>
            {s.replace("_", " ")} <span className="opacity-60">{countOf(s)}</span>
          </Link>
        ))}
      </div>

      <Panel pad={false}>
        <FilterBar>
          {status ? <input suppressHydrationWarning type="hidden" name="status" value={status} /> : null}
          <label className="flex-1 sm:min-w-56">
            <span className="field-label">Search</span>
            <input suppressHydrationWarning name="q" defaultValue={q} placeholder="Name, email, reference or promo code" className="field" />
          </label>
          <label className="sm:w-64">
            <span className="field-label">Service</span>
            <select suppressHydrationWarning name="service" defaultValue={service} className="field">
              <option value="">All services</option>
              {quoteServiceOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="sm:w-40">
            <span className="field-label">Received</span>
            <select suppressHydrationWarning name="range" defaultValue={range} className="field">
              <option value="">Any time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </label>
          <button suppressHydrationWarning className="btn btn-dark">Filter</button>
          {q || service || range ? (
            <Link href={link({ q: "", service: "", range: "" })} className="btn btn-ghost">
              Clear
            </Link>
          ) : null}
        </FilterBar>

        {rows.length ? (
          <Table head={["Client", "Service", "Country", "Promo", "Received", "Status"]}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-mist">
                <td>
                  <Link href={`/admin/quotes/${r.id}`} className="block font-medium text-ink hover:text-blue">
                    {r.name}
                    <span className="block text-xs font-normal text-muted">
                      {r.reference} · {r.email}
                    </span>
                  </Link>
                </td>
                <td className="max-w-56 truncate">{r.service}</td>
                <td>{r.country}</td>
                <td>{r.promoCode ? <code className="rounded bg-mist px-1.5 py-0.5 text-xs">{r.promoCode}</code> : <span className="text-muted">–</span>}</td>
                <td className="whitespace-nowrap text-muted">{formatDate(r.createdAt, true)}</td>
                <td>
                  <Badge value={r.status} />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState title={q || status || service ? "No matching requests" : "No quote requests yet"} text="Requests from the “Request a quote” form will appear here." />
          </div>
        )}
        <Pager page={page} pages={Math.ceil(n / PER_PAGE)} href={(p) => link({ page: p })} />
      </Panel>
    </>
  );
}
