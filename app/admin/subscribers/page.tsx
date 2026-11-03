import type { Metadata } from "next";
import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { adminAddSubscriber, adminUnsubscribe } from "@/app/actions/admin/people";
import { AdminForm, ConfirmAction } from "@/components/admin/forms";
import { Badge, EmptyState, FilterBar, PageHeader, Pager, Panel, StatCard, Table } from "@/components/admin/ui";
import { SubmitButton } from "@/components/forms/fields";
import { formatDate } from "@/lib/utils";
import { Download } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Subscribers" };
const PER_PAGE = 40;

export default async function SubscribersPage({ searchParams }: PageProps<"/admin/subscribers">) {
  await requirePermission("subscribers");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = sp.status === "subscribed" || sp.status === "unsubscribed" ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const where: SQL[] = [];
  if (q) where.push(ilike(schema.emailSubscriptions.email, `%${q}%`));
  if (status) where.push(eq(schema.emailSubscriptions.status, status));
  const cond = where.length ? and(...where) : undefined;

  const [rows, [{ n }], totals] = await Promise.all([
    db.select().from(schema.emailSubscriptions).where(cond).orderBy(desc(schema.emailSubscriptions.createdAt)).limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    db.select({ n: count() }).from(schema.emailSubscriptions).where(cond),
    db.select({ status: schema.emailSubscriptions.status, n: count() }).from(schema.emailSubscriptions).groupBy(schema.emailSubscriptions.status),
  ]);
  const t = (s: string) => totals.find((x) => x.status === s)?.n ?? 0;
  const link = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (p > 1) u.set("page", String(p));
    return `/admin/subscribers${u.size ? `?${u}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Email subscribers"
        description="People who ticked the box to receive research tips, webinar announcements and course news. Campaigns only go to subscribed people. Unsubscribes are honoured automatically."
        actions={
           
          <a href="/api/admin/export/subscribers" download className="btn btn-ghost btn-sm">
            <Download size={16} /> Export CSV
          </a>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard tone="blue" label="Subscribed" value={t("subscribed")} />
        <StatCard label="Unsubscribed" value={t("unsubscribed")} />
        <StatCard tone="mist" label="Total ever opted in" value={t("subscribed") + t("unsubscribed")} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Panel pad={false}>
          <FilterBar>
            <label className="flex-1">
              <span className="field-label">Search</span>
              <input suppressHydrationWarning name="q" defaultValue={q} placeholder="Email address" className="field" />
            </label>
            <label className="sm:w-44">
              <span className="field-label">Status</span>
              <select suppressHydrationWarning name="status" defaultValue={status} className="field">
                <option value="">All</option>
                <option value="subscribed">Subscribed</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </label>
            <button suppressHydrationWarning className="btn btn-dark">Filter</button>
          </FilterBar>
          {rows.length ? (
            <Table head={["Email", "Source", "Opted in", "Status", ""]}>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="font-medium">{s.email}</span>
                    {s.name ? <span className="block text-xs text-muted">{s.name}</span> : null}
                  </td>
                  <td className="text-muted">{s.source.replace(/_/g, " ")}</td>
                  <td className="whitespace-nowrap text-muted">{formatDate(s.consentedAt, true)}</td>
                  <td>
                    <Badge value={s.status} />
                  </td>
                  <td className="text-right">
                    {s.status === "subscribed" ? <ConfirmAction action={adminUnsubscribe} hidden={{ token: s.unsubscribeToken }} label="Unsubscribe" confirmLabel="Unsubscribe" success="Unsubscribed" /> : null}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="p-6">
              <EmptyState title="No subscribers yet" text="People join from the newsletter forms on the website or the checkbox when they create an account." />
            </div>
          )}
          <Pager page={page} pages={Math.ceil(n / PER_PAGE)} href={link} />
        </Panel>

        <Panel title="Add a subscriber" description="Only add people who agreed to receive emails, for example at an event.">
          <AdminForm action={adminAddSubscriber} resetOnSuccess successTitle="Subscriber added">
            <div>
              <label className="field-label" htmlFor="s-email">
                Email
              </label>
              <input suppressHydrationWarning id="s-email" name="email" type="email" required className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="s-name">
                Name <span className="font-normal text-muted">(optional)</span>
              </label>
              <input suppressHydrationWarning id="s-name" name="name" className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="s-src">
                Where did they agree?
              </label>
              <input suppressHydrationWarning id="s-src" name="source" placeholder="e.g. UJ writing retreat sign-up sheet" className="field" />
            </div>
            <label className="flex items-start gap-3 text-sm text-muted">
              <input suppressHydrationWarning type="checkbox" name="confirm" className="mt-0.5 size-5 accent-blue" />
              This person agreed to receive emails from Knowledge Space Academy.
            </label>
            <SubmitButton variant="dark">Add subscriber</SubmitButton>
          </AdminForm>
        </Panel>
      </div>
    </>
  );
}
