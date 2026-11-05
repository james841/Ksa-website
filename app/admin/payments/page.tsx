import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, ilike, or, sum, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { Badge, EmptyState, FilterBar, PageHeader, Pager, Panel, StatCard, Table } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import { checkPayfastReachable, formatPrice, payfastConfig, siteIsLocal } from "@/lib/payments/payfast";
import { absoluteUrl } from "@/lib/utils";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Course payments" };
const PER_PAGE = 25;
const statuses = ["pending", "paid", "failed", "cancelled"] as const;

export default async function PaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  await requirePermission("payments");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status =
    typeof sp.status === "string" && (statuses as readonly string[]).includes(sp.status) ? (sp.status as (typeof statuses)[number]) : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: SQL[] = [];
  if (q) {
    const like = `%${q}%`;
    where.push(or(ilike(schema.payments.reference, like), ilike(schema.payments.email, like), ilike(schema.courses.title, like))!);
  }
  if (status) where.push(eq(schema.payments.status, status));
  const cond = where.length ? and(...where) : undefined;

  const base = db
    .select({
      id: schema.payments.id,
      reference: schema.payments.reference,
      amountCents: schema.payments.amountCents,
      currency: schema.payments.currency,
      status: schema.payments.status,
      email: schema.payments.email,
      createdAt: schema.payments.createdAt,
      paidAt: schema.payments.paidAt,
      courseId: schema.courses.id,
      courseTitle: schema.courses.title,
      learner: schema.users.name,
    })
    .from(schema.payments)
    .innerJoin(schema.courses, eq(schema.courses.id, schema.payments.courseId))
    .leftJoin(schema.users, eq(schema.users.id, schema.payments.userId));

  const [rows, [{ n }], counts, [takings], [{ priced }]] = await Promise.all([
    base.where(cond).orderBy(desc(schema.payments.createdAt)).limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    db
      .select({ n: count() })
      .from(schema.payments)
      .innerJoin(schema.courses, eq(schema.courses.id, schema.payments.courseId))
      .where(cond),
    db.select({ status: schema.payments.status, n: count() }).from(schema.payments).groupBy(schema.payments.status),
    db.select({ total: sum(schema.payments.amountCents) }).from(schema.payments).where(eq(schema.payments.status, "paid")),
    db.select({ priced: count() }).from(schema.courses).where(eq(schema.courses.status, "published")),
  ]);

  const countOf = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const paidTotal = Number(takings?.total ?? 0);
  const cfg = payfastConfig();
  // Only when asked for: ?check=1 adds a few seconds while PayFast is called.
  const reach = sp.check === "1" && cfg.ready ? await checkPayfastReachable() : null;
  const link = (over: Record<string, string | number>) => {
    const p = new URLSearchParams();
    const merged = { q, status, page: 1, ...over };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "page" && v === 1)) p.set(k, String(v));
    const s = p.toString();
    return `/admin/payments${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Course payments"
        description="Every attempt to pay for a course. A learner is given access only when PayFast confirms the payment, so a row here is the record of that."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Paid" value={countOf("paid")} hint="Payments PayFast confirmed" tone="blue" />
        <StatCard label="Taken so far" value={formatPrice(paidTotal)} hint="Total of confirmed payments" />
        <StatCard label="Started, not finished" value={countOf("pending")} hint="Learner left before paying" />
        <StatCard label="Published courses" value={priced} hint="Set a price on each one you want to sell" href="/admin/courses" />
      </div>

      {/* Where the money comes in, in plain words, and whether it is switched on. */}
      <Panel title="How a learner pays" className="mb-6">
        <ol className="grid gap-4 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["1. You set a price", "Admin → Courses → open a course → Price in rand. Leave it at 0 for a free course."],
            ["2. The course is published", "The button only shows on a published course. A “coming soon” course shows “Notify me” instead."],
            ["3. The learner pays", "They sign in, press “Pay … with PayFast” on the course page and pay on PayFast’s own page."],
            ["4. PayFast confirms", "PayFast tells the website directly, the payment shows as paid here, and access opens straight away."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-[1rem] bg-mist p-4">
              <p className="font-semibold text-ink">{t}</p>
              <p className="mt-1.5 leading-relaxed">{d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-[1rem] border border-line p-4 text-sm">
          {cfg.ready ? (
            <>
              <p className="font-semibold text-ink">
                PayFast is connected{" "}
                <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${cfg.sandbox ? "bg-mist text-ink" : "bg-blue text-white"}`}>
                  {cfg.sandbox ? "Test mode" : "Live"}
                </span>
              </p>
              <p className="mt-1.5 text-muted">
                {cfg.sandbox
                  ? "Payments are going to PayFast’s test system, so no real money moves. Remove PAYFAST_SANDBOX when you are ready to take real payments."
                  : "Real card payments are being taken."}{" "}
                Merchant {cfg.merchantId}. PayFast sends its confirmations to <code className="rounded bg-mist px-1.5 py-0.5 text-xs">{absoluteUrl("/api/payfast/notify")}</code>.
              </p>

              {siteIsLocal() ? (
                <p className="mt-3 rounded-xl bg-mist p-3 text-muted">
                  <strong className="font-semibold text-ink">This copy is running on a computer.</strong> PayFast refuses a payment
                  whose return address is a laptop, and shows a “403 ERROR, the request could not be satisfied” page instead, so test
                  payments on the deployed website.
                </p>
              ) : null}

              {/* A 403 from PayFast is easier to understand when you can see it here. */}
              <div className="mt-3">
                <Link href={link({ check: "1" })} className="btn btn-ghost btn-sm">
                  Check the connection to PayFast
                </Link>
                {reach ? (
                  <ul className="mt-3 space-y-1 text-muted">
                    {reach.map((r) => (
                      <li key={r.url}>
                        <code className="rounded bg-mist px-1.5 py-0.5 text-xs">{r.url}</code> → {r.status}
                      </li>
                    ))}
                    <li className="pt-1">
                      “403 blocked” means PayFast’s firewall is refusing this server. Anything else means the connection is fine.
                    </li>
                  </ul>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="font-semibold text-ink">PayFast is not connected yet, so no payment button is shown on any course</p>
              <p className="mt-1.5 text-muted">
                Add <code className="rounded bg-mist px-1.5 py-0.5 text-xs">PAYFAST_MERCHANT_ID</code>,{" "}
                <code className="rounded bg-mist px-1.5 py-0.5 text-xs">PAYFAST_MERCHANT_KEY</code> and{" "}
                <code className="rounded bg-mist px-1.5 py-0.5 text-xs">PAYFAST_PASSPHRASE</code> to the hosting environment variables, then redeploy. Add{" "}
                <code className="rounded bg-mist px-1.5 py-0.5 text-xs">PAYFAST_SANDBOX=true</code> while you are testing. Until then a priced course shows
                “Contact us to enrol”.
              </p>
            </>
          )}
        </div>
      </Panel>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        <Link href={link({ status: "" })} className={`btn btn-sm ${!status ? "btn-dark" : "btn-ghost bg-white"}`}>
          All
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={link({ status: s })} className={`btn btn-sm capitalize ${status === s ? "btn-dark" : "btn-ghost bg-white"}`}>
            {s} <span className="opacity-60">{countOf(s)}</span>
          </Link>
        ))}
      </div>

      <Panel pad={false}>
        <FilterBar>
          {status ? <input suppressHydrationWarning type="hidden" name="status" value={status} /> : null}
          <label className="flex-1 sm:min-w-56">
            <span className="field-label">Search</span>
            <input suppressHydrationWarning name="q" defaultValue={q} placeholder="Reference, email or course" className="field" />
          </label>
          <button suppressHydrationWarning className="btn btn-dark">Filter</button>
          {q ? (
            <Link href={link({ q: "" })} className="btn btn-ghost">
              Clear
            </Link>
          ) : null}
        </FilterBar>

        {rows.length ? (
          <Table head={["Learner", "Course", "Amount", "Started", "Paid", "Status"]}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-mist">
                <td>
                  <span className="block font-medium text-ink">{r.learner ?? "Removed user"}</span>
                  <span className="block text-xs text-muted">
                    {r.reference} · {r.email ?? ""}
                  </span>
                </td>
                <td className="max-w-56 truncate">
                  <Link href={`/admin/courses/${r.courseId}`} className="text-ink hover:text-blue">
                    {r.courseTitle}
                  </Link>
                </td>
                <td className="whitespace-nowrap font-medium text-ink">{formatPrice(r.amountCents, r.currency)}</td>
                <td className="whitespace-nowrap text-muted">{formatDate(r.createdAt, true)}</td>
                <td className="whitespace-nowrap text-muted">{r.paidAt ? formatDate(r.paidAt, true) : "–"}</td>
                <td>
                  <Badge value={r.status} />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              title={q || status ? "No matching payments" : "No payments yet"}
              text="As soon as a learner pays for a course, the payment appears here with its reference and status."
            />
          </div>
        )}
        <Pager page={page} pages={Math.ceil(n / PER_PAGE)} href={(p) => link({ page: p })} />
      </Panel>
    </>
  );
}
