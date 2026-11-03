"use server";

import { after } from "next/server";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { audit } from "@/lib/audit";
import { escapeHtml, markdownToHtml } from "@/lib/email";
import { sendWebinarUpdate } from "@/lib/email/templates";
import { localInputToDate } from "@/lib/time";
import { formatDateTime } from "@/lib/utils";
import type { ActionState } from "@/lib/validation";
import { errMsg, guard, imageFromForm, int, optional, str } from "./helpers";

const webinarSchema = z.object({
  title: z.string().min(3, "Add a title.").max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "The web address can only use lowercase letters, numbers and dashes."),
  summary: z.string().min(10, "Add a short summary (at least 10 characters).").max(400),
  status: z.enum(["draft", "published", "cancelled"]),
});

async function attendeesOf(webinarId: string) {
  return db
    .select({ email: schema.users.email, name: schema.users.name })
    .from(schema.webinarRegistrations)
    .innerJoin(schema.users, eq(schema.users.id, schema.webinarRegistrations.userId))
    .where(eq(schema.webinarRegistrations.webinarId, webinarId));
}

function bustWebinar(slug: string, oldSlug?: string) {
  updateTag("webinars");
  updateTag(`webinar:${slug}`);
  if (oldSlug && oldSlug !== slug) updateTag(`webinar:${oldSlug}`);
}

export async function saveWebinar(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("webinars");
  const id = str(fd, "id");
  const parsed = webinarSchema.safeParse({ title: str(fd, "title"), slug: str(fd, "slug"), summary: str(fd, "summary"), status: str(fd, "status") || "draft" });
  if (!parsed.success) return { ok: false, errors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const startsAt = localInputToDate(str(fd, "startsAt"));
  if (!startsAt) return { ok: false, message: "Choose the date and start time." };
  const endsAt = localInputToDate(str(fd, "endsAt"));
  if (endsAt && endsAt <= startsAt) return { ok: false, message: "The end time must be after the start time." };
  const meetingUrl = optional(fd, "meetingUrl");
  if (meetingUrl && !/^https?:\/\//i.test(meetingUrl)) return { ok: false, message: "The meeting link must start with https://" };

  let newId: string | null = null;
  try {
    const values = {
      ...parsed.data,
      description: str(fd, "description"),
      speakerName: optional(fd, "speakerName"),
      speakerTitle: optional(fd, "speakerTitle"),
      startsAt,
      endsAt,
      meetingUrl,
      meetingDetails: optional(fd, "meetingDetails"),
      capacity: int(fd, "capacity"),
      coverImage: await imageFromForm(fd, "coverImage", admin.id, 1600),
    };
    if (id) {
      const [old] = await db.select({ slug: schema.webinars.slug }).from(schema.webinars).where(eq(schema.webinars.id, id)).limit(1);
      await db.update(schema.webinars).set(values).where(eq(schema.webinars.id, id));
      await audit(admin.id, "update", "webinar", id);
      bustWebinar(values.slug, old?.slug);
      refresh();
      return { ok: true, message: values.status === "published" ? "Saved and live on the website." : "Saved." };
    }
    const [row] = await db.insert(schema.webinars).values(values).returning({ id: schema.webinars.id });
    await audit(admin.id, "create", "webinar", row.id);
    bustWebinar(values.slug);
    newId = row.id;
  } catch (e) {
    return { ok: false, message: errMsg(e) };
  }
  redirect(`/admin/webinars/${newId}?created=1`);
}

export async function cancelWebinar(fd: FormData) {
  const admin = await guard("webinars");
  const id = str(fd, "id");
  const notify = str(fd, "notify") === "1";
  const [w] = await db.update(schema.webinars).set({ status: "cancelled" }).where(eq(schema.webinars.id, id)).returning();
  if (!w) return;
  await audit(admin.id, "cancel", "webinar", id, { notify });
  bustWebinar(w.slug);
  if (notify) {
    const people = await attendeesOf(id);
    after(async () => {
      for (const p of people) {
        await sendWebinarUpdate(
          p.email,
          `Cancelled: ${w.title}`,
          `<p>Hello ${escapeHtml(p.name.split(" ")[0])},</p><p>We are sorry to let you know that <strong>${escapeHtml(w.title)}</strong>, planned for ${formatDateTime(w.startsAt)}, has been cancelled.</p><p>We will let you know about upcoming sessions. Thank you for your understanding.</p>`,
        );
      }
    });
  }
  refresh();
}

export async function deleteWebinar(fd: FormData) {
  const admin = await guard("webinars");
  const id = str(fd, "id");
  const [w] = await db.delete(schema.webinars).where(eq(schema.webinars.id, id)).returning();
  await audit(admin.id, "delete", "webinar", id);
  if (w) bustWebinar(w.slug);
  redirect("/admin/webinars?deleted=1");
}

export async function emailAttendees(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("webinars");
  const id = str(fd, "id");
  const subject = str(fd, "subject");
  const body = str(fd, "body");
  if (subject.length < 3 || body.length < 10) return { ok: false, message: "Add a subject and a message." };
  const people = await attendeesOf(id);
  if (!people.length) return { ok: false, message: "Nobody has registered yet." };
  after(async () => {
    for (const p of people) {
      const personal = body.replace(/\{\{\s*first_name\s*\}\}/g, p.name.split(" ")[0]);
      await sendWebinarUpdate(p.email, subject, `<div style="font-size:16px;line-height:1.7">${markdownToHtml(personal)}</div>`);
      await new Promise((r) => setTimeout(r, 120)); // stay within provider rate limits
    }
  });
  await audit(admin.id, "email_attendees", "webinar", id, { count: people.length, subject });
  return { ok: true, message: `Sending to ${people.length} registered ${people.length === 1 ? "person" : "people"}. This runs in the background.` };
}

export async function toggleAttended(fd: FormData) {
  await guard("webinars");
  const id = str(fd, "id");
  const attended = str(fd, "attended") === "1";
  await db.update(schema.webinarRegistrations).set({ attended }).where(eq(schema.webinarRegistrations.id, id));
  refresh();
}

export async function removeRegistration(fd: FormData) {
  const admin = await guard("webinars");
  const id = str(fd, "id");
  const [r] = await db.delete(schema.webinarRegistrations).where(eq(schema.webinarRegistrations.id, id)).returning();
  if (r) {
    await audit(admin.id, "remove", "webinar_registration", r.webinarId, { userId: r.userId });
    updateTag(`user-webinars:${r.userId}`);
    const [w] = await db.select({ slug: schema.webinars.slug }).from(schema.webinars).where(eq(schema.webinars.id, r.webinarId)).limit(1);
    if (w) updateTag(`webinar:${w.slug}`);
  }
  refresh();
}
