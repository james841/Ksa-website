import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

/** Loads a course for the learning player and works out what this user may see. */
export async function getCourseForLearner(slug: string, user: SessionUser | null) {
  const [course] = await db.select().from(schema.courses).where(eq(schema.courses.slug, slug)).limit(1);
  if (!course) return null;
  const isAdmin = can(user?.staffRole, "courses");
  if (course.status !== "published" && !isAdmin) return null;

  const [modules, lessons, enrollment] = await Promise.all([
    db.select().from(schema.courseModules).where(eq(schema.courseModules.courseId, course.id)).orderBy(asc(schema.courseModules.position)),
    db
      .select({
        id: schema.lessons.id,
        moduleId: schema.lessons.moduleId,
        title: schema.lessons.title,
        durationMinutes: schema.lessons.durationMinutes,
        isPreview: schema.lessons.isPreview,
        position: schema.lessons.position,
        published: schema.lessons.published,
      })
      .from(schema.lessons)
      .where(and(eq(schema.lessons.courseId, course.id), isAdmin ? undefined : eq(schema.lessons.published, true)))
      .orderBy(asc(schema.lessons.position)),
    user
      ? db
          .select()
          .from(schema.enrollments)
          .where(and(eq(schema.enrollments.courseId, course.id), eq(schema.enrollments.userId, user.id)))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  const completed = user
    ? new Set(
        (
          await db
            .select({ lessonId: schema.lessonProgress.lessonId })
            .from(schema.lessonProgress)
            .where(and(eq(schema.lessonProgress.userId, user.id), eq(schema.lessonProgress.courseId, course.id)))
        ).map((r) => r.lessonId),
      )
    : new Set<string>();

  const ordered = modules.flatMap((m) => lessons.filter((l) => l.moduleId === m.id));
  const hasAccess = isAdmin || !!enrollment;
  return {
    course,
    enrollment,
    hasAccess,
    completed,
    ordered,
    modules: modules.map((m) => ({ ...m, lessons: lessons.filter((l) => l.moduleId === m.id) })),
  };
}

export async function getLessonContent(lessonId: string) {
  const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, lessonId)).limit(1);
  if (!lesson) return null;
  const resources = await db
    .select({ id: schema.lessonResources.id, label: schema.lessonResources.label, allowDownload: schema.lessonResources.allowDownload, mime: schema.media.mimeType, size: schema.media.size })
    .from(schema.lessonResources)
    .innerJoin(schema.media, eq(schema.media.id, schema.lessonResources.mediaId))
    .where(eq(schema.lessonResources.lessonId, lessonId));
  return { lesson, resources };
}

export async function getUserCourseIds(userId: string) {
  const rows = await db.select({ courseId: schema.enrollments.courseId }).from(schema.enrollments).where(eq(schema.enrollments.userId, userId));
  return rows.map((r) => r.courseId);
}

export { inArray };
