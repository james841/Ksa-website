import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { logDbError } from "@/lib/db/errors";
import { defaultSettings, type SiteSettings } from "@/lib/settings-types";
import { defaultBoard, defaultFaqs } from "@/lib/content";

/*
 * Public, cached reads. Each function is tagged so the admin can refresh
 * exactly what changed (updateTag("webinars") etc.) without a redeploy.
 * If the database cannot be reached, safe fallbacks are cached briefly.
 */

function onDbError(label: string, e: unknown) {
  logDbError(label, e);
  cacheLife("seconds");
}

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("settings");
  cacheLife("days");
  try {
    const rows = await db.select().from(schema.siteSettings);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      ...defaultSettings,
      ...map,
      socials: { ...defaultSettings.socials, ...((map.socials as object) ?? {}) },
      announcement: { ...defaultSettings.announcement, ...((map.announcement as object) ?? {}) },
    } as SiteSettings;
  } catch (e) {
    onDbError("settings", e);
    return defaultSettings;
  }
}

export async function getFaqs(homeOnly = false) {
  "use cache";
  cacheTag("faqs");
  cacheLife("days");
  try {
    const rows = await db
      .select({ id: schema.faqs.id, question: schema.faqs.question, answer: schema.faqs.answer })
      .from(schema.faqs)
      .where(homeOnly ? and(eq(schema.faqs.published, true), eq(schema.faqs.showOnHome, true)) : eq(schema.faqs.published, true))
      .orderBy(asc(schema.faqs.position));
    return rows;
  } catch (e) {
    onDbError("faqs", e);
    return defaultFaqs.filter((f) => !homeOnly || f.home).map((f, i) => ({ id: String(i), question: f.q, answer: f.a }));
  }
}

export async function getBoard() {
  "use cache";
  cacheTag("board");
  cacheLife("days");
  try {
    return await db.select().from(schema.boardMembers).orderBy(asc(schema.boardMembers.position));
  } catch (e) {
    onDbError("board", e);
    return defaultBoard.map((b, i) => ({ id: String(i), name: b.name, affiliation: b.affiliation, photo: null, position: i }));
  }
}

export async function getSlides() {
  "use cache";
  cacheTag("slides");
  cacheLife("days");
  try {
    return await db
      .select()
      .from(schema.homeSlides)
      .where(eq(schema.homeSlides.published, true))
      .orderBy(asc(schema.homeSlides.position));
  } catch (e) {
    onDbError("slides", e);
    return [];
  }
}

const webinarCols = {
  id: schema.webinars.id,
  slug: schema.webinars.slug,
  title: schema.webinars.title,
  summary: schema.webinars.summary,
  speakerName: schema.webinars.speakerName,
  speakerTitle: schema.webinars.speakerTitle,
  startsAt: schema.webinars.startsAt,
  endsAt: schema.webinars.endsAt,
  coverImage: schema.webinars.coverImage,
  status: schema.webinars.status,
};

export async function getUpcomingWebinars(limit = 6) {
  "use cache";
  cacheTag("webinars");
  cacheLife("hours");
  try {
    return await db
      .select(webinarCols)
      .from(schema.webinars)
      .where(and(eq(schema.webinars.status, "published"), gte(schema.webinars.startsAt, sql`now() - interval '2 hours'`)))
      .orderBy(asc(schema.webinars.startsAt))
      .limit(limit);
  } catch (e) {
    onDbError("upcoming webinars", e);
    return [];
  }
}

export async function getPastWebinars(limit = 9) {
  "use cache";
  cacheTag("webinars");
  cacheLife("hours");
  try {
    return await db
      .select(webinarCols)
      .from(schema.webinars)
      .where(and(eq(schema.webinars.status, "published"), lt(schema.webinars.startsAt, sql`now() - interval '2 hours'`)))
      .orderBy(desc(schema.webinars.startsAt))
      .limit(limit);
  } catch (e) {
    onDbError("past webinars", e);
    return [];
  }
}

export async function getWebinarBySlug(slug: string) {
  "use cache";
  cacheTag("webinars", `webinar:${slug}`);
  cacheLife("hours");
  try {
    const [w] = await db
      .select({
        ...webinarCols,
        description: schema.webinars.description,
        capacity: schema.webinars.capacity,
        registrations: sql<number>`(select count(*)::int from webinar_registrations r where r.webinar_id = "webinars"."id")`,
      })
      .from(schema.webinars)
      .where(and(eq(schema.webinars.slug, slug), inArray(schema.webinars.status, ["published", "cancelled"])))
      .limit(1);
    return w ?? null;
  } catch (e) {
    onDbError("webinar", e);
    return null;
  }
}

export async function getPublicCourses() {
  "use cache";
  cacheTag("courses");
  cacheLife("hours");
  try {
    return await db
      .select({
        id: schema.courses.id,
        slug: schema.courses.slug,
        title: schema.courses.title,
        subtitle: schema.courses.subtitle,
        summary: schema.courses.summary,
        category: schema.courses.category,
        level: schema.courses.level,
        durationLabel: schema.courses.durationLabel,
        coverImage: schema.courses.coverImage,
        status: schema.courses.status,
        enrollmentMode: schema.courses.enrollmentMode,
        lowData: schema.courses.lowData,
        lessonCount: sql<number>`(select count(*)::int from lessons l where l.course_id = "courses"."id" and l.published)`,
      })
      .from(schema.courses)
      .where(inArray(schema.courses.status, ["published", "coming_soon"]))
      .orderBy(asc(schema.courses.position), asc(schema.courses.title));
  } catch (e) {
    onDbError("courses", e);
    return [];
  }
}

export async function getCourseBySlug(slug: string) {
  "use cache";
  cacheTag("courses", `course:${slug}`);
  cacheLife("hours");
  try {
    const [course] = await db
      .select()
      .from(schema.courses)
      .where(and(eq(schema.courses.slug, slug), inArray(schema.courses.status, ["published", "coming_soon"])))
      .limit(1);
    if (!course) return null;
    const modules = await db
      .select()
      .from(schema.courseModules)
      .where(eq(schema.courseModules.courseId, course.id))
      .orderBy(asc(schema.courseModules.position));
    const lessonRows = await db
      .select({
        id: schema.lessons.id,
        moduleId: schema.lessons.moduleId,
        title: schema.lessons.title,
        durationMinutes: schema.lessons.durationMinutes,
        isPreview: schema.lessons.isPreview,
        position: schema.lessons.position,
      })
      .from(schema.lessons)
      .where(and(eq(schema.lessons.courseId, course.id), eq(schema.lessons.published, true)))
      .orderBy(asc(schema.lessons.position));
    return {
      course,
      modules: modules.map((m) => ({ ...m, lessons: lessonRows.filter((l) => l.moduleId === m.id) })),
    };
  } catch (e) {
    onDbError("course", e);
    return null;
  }
}
