import "server-only";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function getMyWebinars(userId: string) {
  const base = db
    .select({
      id: schema.webinars.id,
      slug: schema.webinars.slug,
      title: schema.webinars.title,
      summary: schema.webinars.summary,
      startsAt: schema.webinars.startsAt,
      endsAt: schema.webinars.endsAt,
      meetingUrl: schema.webinars.meetingUrl,
      meetingDetails: schema.webinars.meetingDetails,
      status: schema.webinars.status,
      coverImage: schema.webinars.coverImage,
      speakerName: schema.webinars.speakerName,
    })
    .from(schema.webinarRegistrations)
    .innerJoin(schema.webinars, eq(schema.webinars.id, schema.webinarRegistrations.webinarId));
  const [upcoming, past] = await Promise.all([
    base
      .where(and(eq(schema.webinarRegistrations.userId, userId), gte(schema.webinars.startsAt, sql`now() - interval '2 hours'`)))
      .orderBy(asc(schema.webinars.startsAt)),
    db
      .select({ id: schema.webinars.id, slug: schema.webinars.slug, title: schema.webinars.title, startsAt: schema.webinars.startsAt })
      .from(schema.webinarRegistrations)
      .innerJoin(schema.webinars, eq(schema.webinars.id, schema.webinarRegistrations.webinarId))
      .where(and(eq(schema.webinarRegistrations.userId, userId), lt(schema.webinars.startsAt, sql`now() - interval '2 hours'`)))
      .orderBy(desc(schema.webinars.startsAt))
      .limit(20),
  ]);
  return { upcoming, past };
}

export async function getMyCourses(userId: string) {
  return db
    .select({
      id: schema.courses.id,
      slug: schema.courses.slug,
      title: schema.courses.title,
      category: schema.courses.category,
      coverImage: schema.courses.coverImage,
      lastLessonId: schema.enrollments.lastLessonId,
      completedAt: schema.enrollments.completedAt,
      enrolledAt: schema.enrollments.createdAt,
      total: sql<number>`(select count(*)::int from lessons l where l.course_id = "courses"."id" and l.published)`,
      done: sql<number>`(select count(*)::int from lesson_progress lp join lessons l on l.id = lp.lesson_id where lp.user_id = ${userId} and lp.course_id = "courses"."id" and l.published)`,
    })
    .from(schema.enrollments)
    .innerJoin(schema.courses, eq(schema.courses.id, schema.enrollments.courseId))
    .where(eq(schema.enrollments.userId, userId))
    .orderBy(desc(schema.enrollments.updatedAt));
}

export async function getMyProfile(userId: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  const [sub] = await db.select().from(schema.emailSubscriptions).where(eq(schema.emailSubscriptions.email, u.email)).limit(1);
  return { user: u, subscribed: sub?.status === "subscribed" };
}
