"use server";

import { can } from "@/lib/auth/permissions";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { audit } from "@/lib/audit";
import { sendQuoteReply } from "@/lib/email/templates";
import { localInputToDate } from "@/lib/time";
import type { ActionState } from "@/lib/validation";
import { subscribe, unsubscribeByToken } from "@/lib/subscriptions";
import { bool, errMsg, guard, str } from "./helpers";

/* ───────────── Service requests ───────────── */

const quoteStatuses = ["new", "in_progress", "responded", "closed"] as const;

export async function updateQuote(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("quotes");
  const id = str(fd, "id");
  const status = str(fd, "status") as (typeof quoteStatuses)[number];
  if (!quoteStatuses.includes(status)) return { ok: false, message: "Choose a valid status." };
  const followUpAt = localInputToDate(str(fd, "followUpAt"));
  await db.update(schema.quoteRequests).set({ status, followUpAt }).where(eq(schema.quoteRequests.id, id));
  await audit(admin.id, "update", "quote", id, { status, followUpAt });
  refresh();
  return { ok: true, message: "Saved." };
}

export async function addQuoteNote(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("quotes");
  const id = str(fd, "id");
  const body = str(fd, "body");
  if (body.length < 2) return { ok: false, message: "Write a note first." };
  await db.insert(schema.quoteNotes).values({ quoteId: id, authorId: admin.id, body: body.slice(0, 5000) });
  refresh();
  return { ok: true, message: "Note added." };
}

export async function replyToQuote(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("quotes");
  const id = str(fd, "id");
  const subject = str(fd, "subject");
  const message = str(fd, "message");
  if (subject.length < 3 || message.length < 10) return { ok: false, message: "Add a subject and a message (at least 10 characters)." };
  const [q] = await db.select().from(schema.quoteRequests).where(eq(schema.quoteRequests.id, id)).limit(1);
  if (!q) return { ok: false, message: "Request not found." };
  const res = await sendQuoteReply(q.email, subject, message);
  if (res.error) return { ok: false, message: `The email could not be sent: ${res.error}` };
  await db.insert(schema.quoteNotes).values({ quoteId: id, authorId: admin.id, body: `✉ Emailed client: "${subject}"\n\n${message}` });
  if (q.status === "new" || q.status === "in_progress") await db.update(schema.quoteRequests).set({ status: "responded" }).where(eq(schema.quoteRequests.id, id));
  await audit(admin.id, "reply", "quote", id);
  refresh();
  return { ok: true, message: `Reply sent to ${q.email}.` };
}

export async function deleteQuote(fd: FormData) {
  const admin = await guard("quotes");
  const id = str(fd, "id");
  await db.delete(schema.quoteRequests).where(eq(schema.quoteRequests.id, id));
  await audit(admin.id, "delete", "quote", id);
  redirect("/admin/quotes?deleted=1");
}

/* ───────────── Users ───────────── */

export async function setUserStatus(fd: FormData) {
  const admin = await guard("users");
  const id = str(fd, "id");
  const status = str(fd, "status") === "suspended" ? "suspended" : "active";
  if (id === admin.id) return; // never lock yourself out
  // Team members can only be suspended by someone who manages the team, and super admins only by a super admin.
  const [target] = await db.select({ role: schema.users.role, staffRole: schema.users.staffRole }).from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!target) return;
  if (target.role === "admin") {
    if (!can(admin.staffRole, "team")) return;
    if ((target.staffRole ?? "super_admin") === "super_admin" && admin.staffRole !== "super_admin") return;
  }
  await db.update(schema.users).set({ status }).where(eq(schema.users.id, id));
  if (status === "suspended") await db.delete(schema.sessions).where(eq(schema.sessions.userId, id));
  await audit(admin.id, status === "suspended" ? "suspend" : "reactivate", "user", id);
  refresh();
}

export async function grantCourseAccess(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("users", "courses");
  const userId = str(fd, "userId");
  const courseId = str(fd, "courseId");
  if (!courseId) return { ok: false, message: "Choose a course." };
  await db.insert(schema.enrollments).values({ userId, courseId, source: "admin" }).onConflictDoNothing();
  await audit(admin.id, "grant", "enrollment", courseId, { userId });
  updateTag(`user-courses:${userId}`);
  refresh();
  return { ok: true, message: "Access granted." };
}

export async function grantCourseAccessByEmail(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("users", "courses");
  const courseId = str(fd, "courseId");
  const emails = str(fd, "emails")
    .split(/[\s,;]+/)
    .map((e) => e.toLowerCase())
    .filter((e) => z.string().email().safeParse(e).success);
  if (!emails.length) return { ok: false, message: "Enter at least one valid email address." };
  let granted = 0;
  const missing: string[] = [];
  for (const email of emails) {
    const [u] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (!u) {
      missing.push(email);
      continue;
    }
    await db.insert(schema.enrollments).values({ userId: u.id, courseId, source: "admin" }).onConflictDoNothing();
    updateTag(`user-courses:${u.id}`);
    granted++;
  }
  await audit(admin.id, "grant_bulk", "enrollment", courseId, { granted, missing });
  refresh();
  return {
    ok: granted > 0,
    message: `${granted} learner${granted === 1 ? "" : "s"} given access.${missing.length ? ` No account found for: ${missing.join(", ")}. Ask them to register first.` : ""}`,
  };
}

export async function revokeEnrollment(fd: FormData) {
  const admin = await guard("users", "courses");
  const id = str(fd, "id");
  const [row] = await db.delete(schema.enrollments).where(eq(schema.enrollments.id, id)).returning();
  if (row) {
    await audit(admin.id, "revoke", "enrollment", row.courseId, { userId: row.userId });
    updateTag(`user-courses:${row.userId}`);
  }
  refresh();
}

/* ───────────── Subscribers ───────────── */

export async function adminUnsubscribe(fd: FormData) {
  const admin = await guard("subscribers");
  const token = str(fd, "token");
  await unsubscribeByToken(token, "admin");
  await audit(admin.id, "unsubscribe", "subscriber", token.slice(0, 6));
  refresh();
}

/**
 * Adds someone who has given consent elsewhere (for example on a paper form at an event).
 * The admin must confirm that consent was given.
 */
export async function adminAddSubscriber(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("subscribers");
  const email = str(fd, "email").toLowerCase();
  if (!z.string().email().safeParse(email).success) return { ok: false, message: "Enter a valid email address." };
  if (!bool(fd, "confirm")) return { ok: false, message: "Confirm that this person agreed to receive emails from KSA." };
  try {
    await subscribe({ email, name: str(fd, "name") || null, source: `admin:${str(fd, "source") || "manual"}` });
    await audit(admin.id, "add", "subscriber", null, { email });
    refresh();
    return { ok: true, message: `${email} added.` };
  } catch (e) {
    return { ok: false, message: errMsg(e) };
  }
}
