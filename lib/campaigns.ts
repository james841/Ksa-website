import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { EMAIL_FROM, emailLayout, markdownToHtml, resend, stripHtml } from "@/lib/email";
import { notifyTeam } from "@/lib/notify";
import { absoluteUrl } from "@/lib/utils";
import { unsubscribeUrl } from "@/lib/subscriptions";
import type { EmailCampaign } from "@/lib/db/schema";

/**
 * Recipients are ALWAYS limited to people who opted in to marketing email
 * (email_subscriptions.status = 'subscribed'). Webinar and course audiences
 * are narrowed further to people who registered or enrolled.
 */
export async function resolveAudience(c: Pick<EmailCampaign, "audience" | "audienceRefId">) {
  const subs = schema.emailSubscriptions;
  const base = db
    .selectDistinct({ id: subs.id, email: subs.email, name: subs.name, token: subs.unsubscribeToken })
    .from(subs);

  if (c.audience === "webinar_registrants") {
    return base
      .innerJoin(schema.users, eq(schema.users.email, subs.email))
      .innerJoin(schema.webinarRegistrations, eq(schema.webinarRegistrations.userId, schema.users.id))
      .where(
        and(
          eq(subs.status, "subscribed"),
          c.audienceRefId ? eq(schema.webinarRegistrations.webinarId, c.audienceRefId) : sql`true`,
        ),
      );
  }
  if (c.audience === "course_learners") {
    return base
      .innerJoin(schema.users, eq(schema.users.email, subs.email))
      .innerJoin(schema.enrollments, eq(schema.enrollments.userId, schema.users.id))
      .where(and(eq(subs.status, "subscribed"), c.audienceRefId ? eq(schema.enrollments.courseId, c.audienceRefId) : sql`true`));
  }
  return base.where(eq(subs.status, "subscribed"));
}

export function renderCampaign(c: Pick<EmailCampaign, "subject" | "previewText" | "body">, unsubToken: string | null, name?: string | null) {
  const personal = c.body.replace(/\{\{\s*first_name\s*\}\}/g, (name ?? "").split(" ")[0] || "there");
  const html = emailLayout({
    title: c.subject,
    preheader: c.previewText ?? "",
    body: `<div style="font-size:16px;line-height:1.7">${markdownToHtml(personal)}</div>`,
    unsubscribeUrl: unsubToken ? unsubscribeUrl(unsubToken) : undefined,
  });
  return { html, text: stripHtml(html) };
}

export async function sendTestEmail(c: EmailCampaign, to: string) {
  const { html, text } = renderCampaign(c, null, "Test");
  if (!resend) {
    console.info(`[campaign:test] to ${to}: ${c.subject}`);
    return { ok: true };
  }
  const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject: `[Test] ${c.subject}`, html, text });
  return { ok: !error, error: error?.message };
}

/**
 * Sends a campaign in batches of 100. Safe to call again: already-sent recipients
 * are skipped, so a half-finished send can simply be started again.
 *
 * Anything thrown on the way marks the campaign as failed with the reason, rather
 * than leaving it stuck on "sending" with no way out of it in the admin.
 */
export async function sendCampaign(campaignId: string) {
  try {
    await runCampaign(campaignId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[campaign] send stopped", msg);
    await db
      .update(schema.emailCampaigns)
      .set({ status: "failed", error: msg.slice(0, 500) })
      .where(eq(schema.emailCampaigns.id, campaignId))
      .catch(() => {});
  }
}

async function runCampaign(campaignId: string) {
  const [c] = await db.select().from(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, campaignId)).limit(1);
  if (!c || c.status === "sent") return;

  await db.update(schema.emailCampaigns).set({ status: "sending", error: null }).where(eq(schema.emailCampaigns.id, c.id));
  const audience = await resolveAudience(c);

  if (audience.length) {
    for (let i = 0; i < audience.length; i += 500) {
      await db
        .insert(schema.campaignRecipients)
        .values(audience.slice(i, i + 500).map((a) => ({ campaignId: c.id, subscriptionId: a.id, email: a.email })))
        .onConflictDoNothing();
    }
  }
  await db.update(schema.emailCampaigns).set({ totalRecipients: audience.length }).where(eq(schema.emailCampaigns.id, c.id));

  const queued = await db
    .select({ id: schema.campaignRecipients.id, email: schema.campaignRecipients.email })
    .from(schema.campaignRecipients)
    .where(and(eq(schema.campaignRecipients.campaignId, c.id), eq(schema.campaignRecipients.status, "queued")));
  const byEmail = new Map(audience.map((a) => [a.email, a]));

  for (let i = 0; i < queued.length; i += 100) {
    const chunk = queued.slice(i, i + 100);
    const emails = chunk.map((r) => {
      const a = byEmail.get(r.email);
      const { html, text } = renderCampaign(c, a?.token ?? null, a?.name);
      const oneClick = a ? absoluteUrl(`/api/unsubscribe?token=${a.token}`) : undefined;
      return {
        from: EMAIL_FROM,
        to: r.email,
        subject: c.subject,
        html,
        text,
        headers: oneClick ? { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined,
        tags: [{ name: "campaign", value: c.id }],
      };
    });

    try {
      if (!resend) {
        console.info(`[campaign:dev] "${c.subject}" -> ${chunk.length} recipients`);
        await db.update(schema.campaignRecipients).set({ status: "sent" }).where(inArray(schema.campaignRecipients.id, chunk.map((r) => r.id)));
      } else {
        const { data, error } = await resend.batch.send(emails);
        if (error) throw new Error(error.message);
        const ids = data?.data ?? [];
        await Promise.all(
          chunk.map((r, idx) =>
            db.update(schema.campaignRecipients).set({ status: "sent", providerId: ids[idx]?.id ?? null }).where(eq(schema.campaignRecipients.id, r.id)),
          ),
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[campaign] batch failed", msg);
      await db
        .update(schema.campaignRecipients)
        .set({ status: "failed", error: msg.slice(0, 500) })
        .where(inArray(schema.campaignRecipients.id, chunk.map((r) => r.id)));
    }
    // Stay well under the provider's rate limit.
    await new Promise((r) => setTimeout(r, 600));
  }

  const [{ sent, failed }] = await db
    .select({
      sent: sql<number>`count(*) filter (where status in ('sent','delivered'))::int`,
      failed: sql<number>`count(*) filter (where status = 'failed')::int`,
    })
    .from(schema.campaignRecipients)
    .where(eq(schema.campaignRecipients.campaignId, c.id));

  await db
    .update(schema.emailCampaigns)
    .set({ status: failed && !sent ? "failed" : "sent", sentAt: new Date(), sentCount: sent, failedCount: failed })
    .where(eq(schema.emailCampaigns.id, c.id));

  // Tell the marketing side how the send went, including scheduled sends that
  // run while nobody is logged in.
  await notifyTeam({
    event: "campaign",
    subject: failed && !sent ? `Campaign failed: ${c.subject}` : `Campaign sent: ${c.subject}`,
    headline: failed && !sent ? `"${c.subject}" could not be sent` : `"${c.subject}" has gone out`,
    rows: [
      ["Subject", c.subject],
      ["Delivered to provider", String(sent)],
      ["Failed", String(failed)],
      ["Audience size", String(audience.length)],
    ],
    link: `/admin/campaigns/${c.id}`,
    linkLabel: "See the delivery log",
  });
}
