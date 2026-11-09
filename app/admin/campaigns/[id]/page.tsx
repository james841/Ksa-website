import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, count, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { renderCampaign, resolveAudience } from "@/lib/campaigns";
import { deleteCampaign, duplicateCampaign, resumeCampaign, retryCampaign, scheduleCampaign, sendCampaignNow, sendCampaignTest, unscheduleCampaign } from "@/app/actions/admin/campaigns";
import { ActionButton, AdminForm, ConfirmAction } from "@/components/admin/forms";
import { Badge, PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { CampaignForm } from "@/components/admin/campaign-form";
import { SubmitButton } from "@/components/forms/fields";
import { dateToLocalInput } from "@/lib/time";
import { formatDateTime } from "@/lib/utils";
import { nowMs } from "@/lib/now";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignDetail({ params, searchParams }: PageProps<"/admin/campaigns/[id]">) {
  const admin = await requirePermission("campaigns");
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [c] = await db.select().from(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, id)).limit(1);
  if (!c) notFound();
  const editable = c.status === "draft" || c.status === "scheduled";

  const [webinars, courses, audience, stats, recipients] = await Promise.all([
    db.select({ id: schema.webinars.id, title: schema.webinars.title }).from(schema.webinars).orderBy(desc(schema.webinars.startsAt)).limit(50),
    db.select({ id: schema.courses.id, title: schema.courses.title }).from(schema.courses).orderBy(asc(schema.courses.title)),
    editable ? resolveAudience(c) : Promise.resolve([]),
    db.select({ status: schema.campaignRecipients.status, n: count() }).from(schema.campaignRecipients).where(eq(schema.campaignRecipients.campaignId, id)).groupBy(schema.campaignRecipients.status),
    editable
      ? Promise.resolve([])
      : db
          .select({ email: schema.campaignRecipients.email, status: schema.campaignRecipients.status, error: schema.campaignRecipients.error, updatedAt: schema.campaignRecipients.updatedAt })
          .from(schema.campaignRecipients)
          .where(eq(schema.campaignRecipients.campaignId, id))
          .orderBy(desc(schema.campaignRecipients.updatedAt))
          .limit(200),
  ]);
  const stat = (s: string) => stats.find((x) => x.status === s)?.n ?? 0;
  const preview = renderCampaign(c, null, admin.name).html;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/campaigns", label: "Campaigns" }}
        title={c.subject}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge value={c.status} />
            {c.status === "scheduled" ? `Goes out ${formatDateTime(c.scheduledAt)}` : c.sentAt ? `Sent ${formatDateTime(c.sentAt)}` : editable ? `Will reach ${audience.length} opted-in ${audience.length === 1 ? "person" : "people"}` : null}
          </span>
        }
        actions={<ActionButton action={duplicateCampaign} hidden={{ id: c.id }}>Duplicate</ActionButton>}
      />
      {sp.created ? (
        <p role="status" className="mb-6 rounded-xl bg-[#e8f5ee] px-4 py-3 text-sm font-medium text-success">
          Draft created. Send yourself a test before sending it to everyone.
        </p>
      ) : null}

      {!editable ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard tone="ink" label="Recipients" value={c.totalRecipients} />
          <StatCard label="Accepted by Resend" value={stat("sent") + stat("delivered")} hint={stat("delivered") ? `${stat("delivered")} confirmed delivered` : "Delivery updates arrive via webhook"} />
          <StatCard label="Bounced or complained" value={stat("bounced") + stat("complained")} hint="These addresses are unsubscribed automatically" />
          <StatCard tone={stat("failed") ? "blue" : "mist"} label="Failed" value={stat("failed")} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <Panel title={editable ? "Edit" : "Content"} description={editable ? undefined : "Sent campaigns are locked. Duplicate it to send a new version."}>
            <CampaignForm campaign={c} webinars={webinars} courses={courses} disabled={!editable} />
          </Panel>
        </div>

        <div className="space-y-6">
          {editable ? (
            <>
              <Panel title="1. Send a test">
                <AdminForm action={sendCampaignTest} successTitle="Test email sent" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:space-y-0">
                  <input suppressHydrationWarning type="hidden" name="id" value={c.id} />
                  <label className="flex-1">
                    <span className="field-label">Send to</span>
                    <input suppressHydrationWarning name="to" type="email" defaultValue={admin.email} className="field" />
                  </label>
                  <SubmitButton variant="ghost" pendingText="Sending…">
                    Send test
                  </SubmitButton>
                </AdminForm>
                <p className="mt-2 text-xs text-muted">Save your latest edits first. Tests use the saved version.</p>
              </Panel>
              <Panel title="2. Send or schedule">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mist p-4">
                    <p className="text-sm">
                      Send now to <strong>{audience.length}</strong> {audience.length === 1 ? "person" : "people"}
                    </p>
                    {audience.length ? (
                      <ConfirmAction action={sendCampaignNow} hidden={{ id: c.id }} label="Send now" confirmLabel={`Yes, send to ${audience.length}`} tone="dark" success="Sending now" />
                    ) : (
                      <span className="text-xs text-muted">Nobody matches this audience yet.</span>
                    )}
                  </div>
                  {c.status === "scheduled" ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm">Scheduled for {formatDateTime(c.scheduledAt)}</p>
                      <ActionButton action={unscheduleCampaign} hidden={{ id: c.id }} success="Schedule cancelled">
                        Unschedule
                      </ActionButton>
                    </div>
                  ) : (
                    <AdminForm action={scheduleCampaign} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:space-y-0" successTitle="Campaign scheduled">
                      <input suppressHydrationWarning type="hidden" name="id" value={c.id} />
                      <label className="flex-1">
                        <span className="field-label">Or schedule for (Lagos time)</span>
                        <input suppressHydrationWarning name="scheduledAt" type="datetime-local" required defaultValue={dateToLocalInput(new Date(nowMs() + 864e5))} className="field" />
                      </label>
                      <SubmitButton variant="ghost">Schedule</SubmitButton>
                    </AdminForm>
                  )}
                  <p className="text-xs text-muted">Scheduled sending needs the cron job from the README (it checks every 10 minutes).</p>
                </div>
              </Panel>
            </>
          ) : c.status === "sending" ? (
            <Panel title="Sending">
              {/* Progress in plain numbers, and a way out: sending happens in the
                  background, so a hosting time limit or a restart can leave a
                  campaign stuck here with nothing to press. */}
              <p className="text-sm text-muted">
                Emails go out in batches of 100. <strong className="text-ink">{stat("sent") + stat("delivered")}</strong> sent so far,{" "}
                <strong className="text-ink">{stat("queued")}</strong> still to go
                {stat("failed") ? <>, {stat("failed")} failed</> : null}. Refresh this page to see progress.
              </p>
              {stat("queued") ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mist p-4">
                  <p className="text-sm text-muted">
                    Stopped partway? Start it again. Only the {stat("queued")} still waiting are sent, so nobody receives it twice.
                  </p>
                  <ActionButton action={resumeCampaign} hidden={{ id: c.id }} variant="dark" success="Picking up where it stopped">
                    Resume sending
                  </ActionButton>
                </div>
              ) : null}
            </Panel>
          ) : stat("failed") ? (
            <Panel title="Some emails failed">
              {/* The reason, in the provider's own words, so the fix is obvious. */}
              {c.error ? <p className="mb-4 rounded-xl bg-mist p-4 text-sm text-ink">{c.error}</p> : null}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">Retry only the {stat("failed")} failed addresses. Nobody receives it twice.</p>
                <ActionButton action={retryCampaign} hidden={{ id: c.id }} variant="dark" success="Retrying the failed addresses">
                  Retry failed
                </ActionButton>
              </div>
            </Panel>
          ) : null}

          <Panel title="Preview" description="How it looks in an inbox." pad={false}>
            <iframe title="Email preview" srcDoc={preview} sandbox="" className="h-[560px] w-full rounded-b-[1.25rem] bg-[#f6f0e2]" />
          </Panel>

          {editable ? (
            <div className="flex justify-end">
              <ConfirmAction action={deleteCampaign} hidden={{ id: c.id }} label="Delete draft" confirmLabel="Delete" />
            </div>
          ) : null}
        </div>
      </div>

      {recipients.length ? (
        <Panel title="Delivery log" description="Most recent 200 updates" pad={false} className="mt-8">
          <Table head={["Email", "Status", "Updated", "Error"]}>
            {recipients.map((r) => (
              <tr key={r.email}>
                <td className="font-medium">{r.email}</td>
                <td>
                  <Badge value={r.status} />
                </td>
                <td className="whitespace-nowrap text-muted">{formatDateTime(r.updatedAt)}</td>
                <td className="max-w-72 truncate text-xs text-danger">{r.error}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      ) : null}
    </>
  );
}
