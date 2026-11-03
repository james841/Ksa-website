import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { Badge, EmptyState, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Plus } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Email campaigns" };

const audienceLabel = { all_subscribers: "All subscribers", webinar_registrants: "Webinar registrants", course_learners: "Course learners" } as const;

export default async function CampaignsPage() {
  await requirePermission("campaigns");
  const [rows, [{ subs }]] = await Promise.all([
    db.select().from(schema.emailCampaigns).orderBy(desc(schema.emailCampaigns.createdAt)).limit(100),
    db.select({ subs: count() }).from(schema.emailSubscriptions).where(eq(schema.emailSubscriptions.status, "subscribed")),
  ]);
  const sent = rows.filter((r) => r.status === "sent");

  return (
    <>
      <PageHeader
        title="Email campaigns"
        description="Newsletters, webinar announcements and course launches, sent through Resend to people who opted in."
        actions={
          <Link href="/admin/campaigns/new" className="btn btn-primary btn-sm">
            <Plus size={16} /> New campaign
          </Link>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard tone="ink" label="Can receive campaigns" value={subs} hint="Opted-in subscribers" href="/admin/subscribers" />
        <StatCard label="Campaigns sent" value={sent.length} />
        <StatCard tone="mist" label="Emails delivered to provider" value={sent.reduce((a, r) => a + r.sentCount, 0)} hint="Across all sent campaigns" />
      </div>
      <Panel pad={false}>
        {rows.length ? (
          <Table head={["Campaign", "Audience", "Recipients", "Date", "Status"]}>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-mist">
                <td>
                  <Link href={`/admin/campaigns/${c.id}`} className="font-medium text-ink hover:text-blue">
                    {c.subject}
                  </Link>
                </td>
                <td className="text-muted">{audienceLabel[c.audience]}</td>
                <td className="whitespace-nowrap">
                  {c.status === "sent" || c.status === "sending" ? (
                    <>
                      {c.sentCount}
                      <span className="text-muted"> / {c.totalRecipients}</span>
                      {c.failedCount ? <span className="ml-1 text-xs font-semibold text-danger">{c.failedCount} failed</span> : null}
                    </>
                  ) : (
                    <span className="text-muted">–</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-muted">
                  {c.status === "scheduled" ? formatDateTime(c.scheduledAt) : c.sentAt ? formatDate(c.sentAt, true) : formatDate(c.createdAt, true)}
                </td>
                <td>
                  <Badge value={c.status} />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No campaigns yet"
              text="Write a monthly newsletter or announce your next webinars."
              action={
                <Link href="/admin/campaigns/new" className="btn btn-dark btn-sm">
                  Write a campaign
                </Link>
              }
            />
          </div>
        )}
      </Panel>
    </>
  );
}
