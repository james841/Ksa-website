"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { audit } from "@/lib/audit";
import { sendCampaign, sendTestEmail } from "@/lib/campaigns";
import { localInputToDate } from "@/lib/time";
import type { ActionState } from "@/lib/validation";
import { errMsg, guard, optional, str } from "./helpers";

const campaignSchema = z.object({
  subject: z.string().min(3, "Add a subject line.").max(200),
  body: z.string().min(20, "Write the email (at least 20 characters)."),
  audience: z.enum(["all_subscribers", "webinar_registrants", "course_learners"]),
});

async function editable(id: string) {
  const [c] = await db.select().from(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, id)).limit(1);
  return c && (c.status === "draft" || c.status === "scheduled") ? c : null;
}

export async function saveCampaign(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("campaigns");
  const id = str(fd, "id");
  const parsed = campaignSchema.safeParse({ subject: str(fd, "subject"), body: str(fd, "body"), audience: str(fd, "audience") || "all_subscribers" });
  if (!parsed.success) return { ok: false, errors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const audienceRefId =
    parsed.data.audience === "webinar_registrants" ? optional(fd, "webinarId") : parsed.data.audience === "course_learners" ? optional(fd, "courseId") : null;
  const values = { ...parsed.data, previewText: optional(fd, "previewText"), audienceRefId };

  let newId: string | null = null;
  try {
    if (id) {
      const c = await editable(id);
      if (!c) return { ok: false, message: "This campaign has already been sent and can no longer be edited." };
      await db.update(schema.emailCampaigns).set(values).where(eq(schema.emailCampaigns.id, id));
      refresh();
      return { ok: true, message: "Draft saved." };
    }
    const [row] = await db.insert(schema.emailCampaigns).values({ ...values, createdBy: admin.id }).returning({ id: schema.emailCampaigns.id });
    await audit(admin.id, "create", "campaign", row.id);
    newId = row.id;
  } catch (e) {
    return { ok: false, message: errMsg(e) };
  }
  redirect(`/admin/campaigns/${newId}?created=1`);
}

export async function sendCampaignTest(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("campaigns");
  const [c] = await db.select().from(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, str(fd, "id"))).limit(1);
  if (!c) return { ok: false, message: "Campaign not found." };
  const to = str(fd, "to") || admin.email;
  if (!z.string().email().safeParse(to).success) return { ok: false, message: "Enter a valid email address." };
  const res = await sendTestEmail(c, to);
  return res.ok ? { ok: true, message: `Test sent to ${to}. Check the inbox (and the spam folder).` } : { ok: false, message: `Test failed: ${res.error}` };
}

export async function sendCampaignNow(fd: FormData) {
  const admin = await guard("campaigns");
  const id = str(fd, "id");
  const c = await editable(id);
  if (!c) return;
  await db.update(schema.emailCampaigns).set({ status: "sending", scheduledAt: null }).where(eq(schema.emailCampaigns.id, id));
  await audit(admin.id, "send", "campaign", id);
  // Sending runs after the response so the admin page does not wait for every batch.
  after(() => sendCampaign(id));
  refresh();
}

export async function scheduleCampaign(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("campaigns");
  const id = str(fd, "id");
  const when = localInputToDate(str(fd, "scheduledAt"));
  if (!when || when.getTime() < Date.now() + 60_000) return { ok: false, message: "Choose a time at least a few minutes from now." };
  const c = await editable(id);
  if (!c) return { ok: false, message: "This campaign can no longer be scheduled." };
  await db.update(schema.emailCampaigns).set({ status: "scheduled", scheduledAt: when }).where(eq(schema.emailCampaigns.id, id));
  await audit(admin.id, "schedule", "campaign", id, { when });
  refresh();
  return { ok: true, message: "Scheduled. It will go out automatically at that time." };
}

export async function unscheduleCampaign(fd: FormData) {
  await guard("campaigns");
  const id = str(fd, "id");
  await db.update(schema.emailCampaigns).set({ status: "draft", scheduledAt: null }).where(eq(schema.emailCampaigns.id, id));
  refresh();
}

export async function retryCampaign(fd: FormData) {
  const admin = await guard("campaigns");
  const id = str(fd, "id");
  // Only failed recipients are retried. People who already received it are never emailed twice.
  await db
    .update(schema.campaignRecipients)
    .set({ status: "queued", error: null })
    .where(and(eq(schema.campaignRecipients.campaignId, id), eq(schema.campaignRecipients.status, "failed")));
  await db.update(schema.emailCampaigns).set({ status: "draft" }).where(eq(schema.emailCampaigns.id, id));
  await audit(admin.id, "retry", "campaign", id);
  after(() => sendCampaign(id));
  refresh();
}

export async function deleteCampaign(fd: FormData) {
  const admin = await guard("campaigns");
  const id = str(fd, "id");
  const c = await editable(id);
  if (c) {
    await db.delete(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, id));
    await audit(admin.id, "delete", "campaign", id);
  }
  redirect("/admin/campaigns?deleted=1");
}

export async function duplicateCampaign(fd: FormData) {
  const admin = await guard("campaigns");
  const [c] = await db.select().from(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, str(fd, "id"))).limit(1);
  if (!c) return;
  const [row] = await db
    .insert(schema.emailCampaigns)
    .values({ subject: `${c.subject} (copy)`, previewText: c.previewText, body: c.body, audience: c.audience, audienceRefId: c.audienceRefId, createdBy: admin.id })
    .returning({ id: schema.emailCampaigns.id });
  redirect(`/admin/campaigns/${row.id}`);
}
