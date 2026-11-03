"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { createSession, destroySession, getCurrentUser, requireUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getClientInfo } from "@/lib/request";
import { setSubscriptionForUser } from "@/lib/subscriptions";
import { sendWebinarConfirmation } from "@/lib/email/templates";
import { notifyTeam } from "@/lib/notify";
import { passwordRule, type ActionState } from "@/lib/validation";
import { z } from "zod";

/* ----------------------------- Webinars ----------------------------- */

export async function registerForWebinar(slug: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/webinars/${slug}`)}`);

  const [w] = await db.select().from(schema.webinars).where(eq(schema.webinars.slug, slug)).limit(1);
  if (!w || w.status !== "published") return { ok: false, message: "This webinar is not open for registration." };
  if (w.startsAt.getTime() < Date.now() - 60 * 60_000) return { ok: false, message: "This webinar has already taken place." };

  if (w.capacity) {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.webinarRegistrations)
      .where(eq(schema.webinarRegistrations.webinarId, w.id));
    if (n >= w.capacity) return { ok: false, message: "Sorry, this webinar is full." };
  }

  // The unique index on (webinar, user) prevents duplicate registrations.
  const inserted = await db
    .insert(schema.webinarRegistrations)
    .values({ webinarId: w.id, userId: user.id })
    .onConflictDoNothing()
    .returning({ id: schema.webinarRegistrations.id });

  if (inserted.length) {
    await sendWebinarConfirmation(user.email, user.name, w).catch((e) => console.error(e));
    await notifyTeam({
      event: "webinar_registration",
      subject: `New webinar registration: ${w.title}`,
      headline: `${user.name} registered for ${w.title}`,
      rows: [
        ["Webinar", w.title],
        ["Name", user.name],
        ["Email", user.email],
      ],
      link: `/admin/webinars/${w.id}`,
      linkLabel: "See the attendee list",
    });
    updateTag(`webinar:${slug}`);
    updateTag(`user-webinars:${user.id}`);
  }
  return { ok: true, message: inserted.length ? "You're registered. Check your email for the details." : "You're already registered for this webinar." };
}

export async function cancelWebinarRegistration(slug: string): Promise<ActionState> {
  const user = await requireUser();
  const [w] = await db.select({ id: schema.webinars.id }).from(schema.webinars).where(eq(schema.webinars.slug, slug)).limit(1);
  if (!w) return { ok: false, message: "Webinar not found." };
  await db
    .delete(schema.webinarRegistrations)
    .where(and(eq(schema.webinarRegistrations.webinarId, w.id), eq(schema.webinarRegistrations.userId, user.id)));
  updateTag(`webinar:${slug}`);
  updateTag(`user-webinars:${user.id}`);
  return { ok: true, message: "Your registration has been cancelled." };
}

/* ------------------------------ Courses ------------------------------ */

export async function enrollInCourse(slug: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
  const [c] = await db.select().from(schema.courses).where(eq(schema.courses.slug, slug)).limit(1);
  if (!c || c.status !== "published") redirect(`/courses/${slug}`);
  if (c.enrollmentMode !== "open" && user.role !== "admin") redirect(`/courses/${slug}?access=invite`);
  const joined = await db
    .insert(schema.enrollments)
    .values({ courseId: c.id, userId: user.id, source: "self" })
    .onConflictDoNothing()
    .returning({ id: schema.enrollments.id });
  updateTag(`user-courses:${user.id}`);
  if (joined.length)
    await notifyTeam({
      event: "course_enrolment",
      subject: `New enrolment: ${c.title}`,
      headline: `${user.name} enrolled in ${c.title}`,
      rows: [
        ["Course", c.title],
        ["Name", user.name],
        ["Email", user.email],
      ],
      link: `/admin/courses/${c.id}`,
      linkLabel: "Open the course",
    });
  const [first] = await db
    .select({ id: schema.lessons.id })
    .from(schema.lessons)
    .innerJoin(schema.courseModules, eq(schema.courseModules.id, schema.lessons.moduleId))
    .where(and(eq(schema.lessons.courseId, c.id), eq(schema.lessons.published, true)))
    .orderBy(schema.courseModules.position, schema.lessons.position)
    .limit(1);
  redirect(first ? `/learn/${slug}/${first.id}` : `/dashboard/courses`);
}

export async function notifyMeAboutCourse(slug: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
  const [c] = await db.select({ id: schema.courses.id, title: schema.courses.title }).from(schema.courses).where(eq(schema.courses.slug, slug)).limit(1);
  if (!c) return { ok: false, message: "Course not found." };
  const asked = await db
    .insert(schema.courseInterest)
    .values({ courseId: c.id, userId: user.id })
    .onConflictDoNothing()
    .returning({ userId: schema.courseInterest.userId });
  if (asked.length)
    await notifyTeam({
      event: "course_interest",
      subject: `Someone is waiting for: ${c.title}`,
      headline: `${user.name} asked to be told when ${c.title} opens`,
      rows: [
        ["Course", c.title],
        ["Name", user.name],
        ["Email", user.email],
      ],
      link: `/admin/courses/${c.id}`,
      linkLabel: "Open the course",
    });
  return { ok: true, message: "Thanks. We will email you when this course opens." };
}

export async function setLessonComplete(lessonId: string, complete: boolean) {
  const user = await requireUser();
  const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, lessonId)).limit(1);
  if (!lesson) return { ok: false };
  const [enr] = await db
    .select()
    .from(schema.enrollments)
    .where(and(eq(schema.enrollments.courseId, lesson.courseId), eq(schema.enrollments.userId, user.id)))
    .limit(1);
  if (!enr) return { ok: false };

  if (complete) {
    await db.insert(schema.lessonProgress).values({ userId: user.id, lessonId, courseId: lesson.courseId }).onConflictDoNothing();
  } else {
    await db.delete(schema.lessonProgress).where(and(eq(schema.lessonProgress.userId, user.id), eq(schema.lessonProgress.lessonId, lessonId)));
  }

  // Mark the course complete when every published lesson is done.
  const [{ total, done }] = await db
    .select({
      total: sql<number>`(select count(*)::int from lessons where course_id = ${lesson.courseId} and published)`,
      done: sql<number>`(select count(*)::int from lesson_progress lp join lessons l on l.id = lp.lesson_id where lp.user_id = ${user.id} and lp.course_id = ${lesson.courseId} and l.published)`,
    })
    .from(sql`(select 1) as one`);
  await db
    .update(schema.enrollments)
    .set({ lastLessonId: lessonId, completedAt: total > 0 && done >= total ? (enr.completedAt ?? new Date()) : null })
    .where(eq(schema.enrollments.id, enr.id));
  updateTag(`user-courses:${user.id}`);
  return { ok: true, done, total };
}

/* ------------------------------ Account ------------------------------ */

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  country: z.string().trim().max(120).optional(),
  institution: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
});

export async function updateProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, errors: { name: parsed.error.issues[0].message } };
  await db
    .update(schema.users)
    .set({ name: parsed.data.name, country: parsed.data.country || null, institution: parsed.data.institution || null, phone: parsed.data.phone || null })
    .where(eq(schema.users.id, user.id));
  return { ok: true, message: "Profile saved." };
}

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!rateLimit(`pwchange:${user.id}`, 5, 15 * 60_000).ok) return { ok: false, message: "Too many attempts. Please wait 15 minutes." };
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  if (!(await verifyPassword(String(fd.get("current") ?? ""), row.passwordHash))) return { ok: false, errors: { current: "Your current password is not correct." } };
  const next = passwordRule.safeParse(String(fd.get("password") ?? ""));
  if (!next.success) return { ok: false, errors: { password: next.error.issues[0].message } };
  await db.update(schema.users).set({ passwordHash: await hashPassword(next.data) }).where(eq(schema.users.id, user.id));
  // Sign out every other device, then give this browser a fresh session.
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
  await createSession(user.id);
  return { ok: true, message: "Password changed. You have been signed out on your other devices." };
}

export async function updateEmailPreferences(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { ip } = await getClientInfo();
  await setSubscriptionForUser(user, fd.get("marketing") === "on", ip);
  return { ok: true, message: fd.get("marketing") === "on" ? "You will receive KSA emails." : "You have been unsubscribed from KSA emails." };
}

export async function signOutEverywhere() {
  const user = await requireUser();
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
  await destroySession();
  redirect("/login");
}
