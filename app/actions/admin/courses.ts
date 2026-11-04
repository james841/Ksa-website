"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq, gt, lt, desc, max } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { audit } from "@/lib/audit";
import { storePrivateFile } from "@/lib/uploads";
import { deleteStoredFile } from "@/lib/storage";
import type { ActionState } from "@/lib/validation";
import { bool, errMsg, guard, imageFromForm, int, optional, str } from "./helpers";

const courseSchema = z.object({
  title: z.string().min(3, "Add a course title.").max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "The web address can only use lowercase letters, numbers and dashes."),
  summary: z.string().min(10, "Add a short summary (at least 10 characters).").max(600),
  status: z.enum(["draft", "coming_soon", "published", "archived"]),
  level: z.enum(["all", "beginner", "intermediate", "advanced"]),
  enrollmentMode: z.enum(["open", "invite"]),
});

async function slugOf(courseId: string) {
  const [c] = await db.select({ slug: schema.courses.slug }).from(schema.courses).where(eq(schema.courses.id, courseId)).limit(1);
  return c?.slug;
}

async function bustCourse(courseId: string, extraSlug?: string) {
  updateTag("courses");
  const slug = await slugOf(courseId);
  if (slug) updateTag(`course:${slug}`);
  if (extraSlug && extraSlug !== slug) updateTag(`course:${extraSlug}`);
}

export async function saveCourse(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("courses");
  const id = str(fd, "id");
  const parsed = courseSchema.safeParse({
    title: str(fd, "title"),
    slug: str(fd, "slug"),
    summary: str(fd, "summary"),
    status: str(fd, "status") || "draft",
    level: str(fd, "level") || "all",
    enrollmentMode: str(fd, "enrollmentMode") || "open",
  });
  if (!parsed.success) return { ok: false, errors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };

  let newId: string | null = null;
  try {
    const values = {
      ...parsed.data,
      subtitle: optional(fd, "subtitle"),
      description: str(fd, "description"),
      outcomes: str(fd, "outcomes")
        .split("\n")
        .map((l) => l.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 20),
      category: str(fd, "category") || "Research skills",
      durationLabel: optional(fd, "durationLabel"),
      instructorName: optional(fd, "instructorName"),
      instructorBio: optional(fd, "instructorBio"),
      position: int(fd, "position") ?? 0,
      lowData: bool(fd, "lowData"),
      // Money is kept in cents so there is never a rounding surprise.
      priceCents: Math.max(0, Math.round((Number.parseFloat(str(fd, "price")) || 0) * 100)),
      coverImage: await imageFromForm(fd, "coverImage", admin.id, 1600),
    };
    if (id) {
      const [old] = await db.select().from(schema.courses).where(eq(schema.courses.id, id)).limit(1);
      await db
        .update(schema.courses)
        .set({ ...values, publishedAt: values.status === "published" && !old?.publishedAt ? new Date() : old?.publishedAt })
        .where(eq(schema.courses.id, id));
      await audit(admin.id, "update", "course", id, { status: values.status });
      await bustCourse(id, old?.slug);
      refresh();
      return { ok: true, message: values.status === "published" ? "Saved. The course is live." : "Saved." };
    }
    const [row] = await db
      .insert(schema.courses)
      .values({ ...values, publishedAt: values.status === "published" ? new Date() : null })
      .returning({ id: schema.courses.id });
    await audit(admin.id, "create", "course", row.id);
    await bustCourse(row.id);
    newId = row.id;
  } catch (e) {
    return { ok: false, message: errMsg(e) };
  }
  redirect(`/admin/courses/${newId}?created=1`);
}

export async function deleteCourse(fd: FormData) {
  const admin = await guard("courses");
  const id = str(fd, "id");
  const slug = await slugOf(id);
  await db.delete(schema.courses).where(eq(schema.courses.id, id));
  await audit(admin.id, "delete", "course", id);
  updateTag("courses");
  if (slug) updateTag(`course:${slug}`);
  redirect("/admin/courses?deleted=1");
}

/* ───────────── Modules ───────────── */

export async function addModule(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("courses");
  const courseId = str(fd, "courseId");
  const title = str(fd, "title");
  if (title.length < 2) return { ok: false, message: "Give the module a title." };
  const [{ m }] = await db.select({ m: max(schema.courseModules.position) }).from(schema.courseModules).where(eq(schema.courseModules.courseId, courseId));
  await db.insert(schema.courseModules).values({ courseId, title, summary: optional(fd, "summary"), position: (m ?? -1) + 1 });
  await audit(admin.id, "create", "module", courseId, { title });
  await bustCourse(courseId);
  refresh();
  return { ok: true, message: "Module added." };
}

export async function updateModule(_p: ActionState, fd: FormData): Promise<ActionState> {
  await guard("courses");
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (title.length < 2) return { ok: false, message: "Give the module a title." };
  const [row] = await db.update(schema.courseModules).set({ title, summary: optional(fd, "summary") }).where(eq(schema.courseModules.id, id)).returning();
  if (row) await bustCourse(row.courseId);
  refresh();
  return { ok: true, message: "Saved." };
}

export async function moveModule(fd: FormData) {
  await guard("courses");
  const id = str(fd, "id");
  const dir = str(fd, "dir");
  const [mod] = await db.select().from(schema.courseModules).where(eq(schema.courseModules.id, id)).limit(1);
  if (!mod) return;
  const [swap] = await db
    .select()
    .from(schema.courseModules)
    .where(and(eq(schema.courseModules.courseId, mod.courseId), dir === "up" ? lt(schema.courseModules.position, mod.position) : gt(schema.courseModules.position, mod.position)))
    .orderBy(dir === "up" ? desc(schema.courseModules.position) : asc(schema.courseModules.position))
    .limit(1);
  if (!swap) return;
  await db.update(schema.courseModules).set({ position: swap.position }).where(eq(schema.courseModules.id, mod.id));
  await db.update(schema.courseModules).set({ position: mod.position }).where(eq(schema.courseModules.id, swap.id));
  await bustCourse(mod.courseId);
  refresh();
}

export async function deleteModule(fd: FormData) {
  const admin = await guard("courses");
  const id = str(fd, "id");
  const [row] = await db.delete(schema.courseModules).where(eq(schema.courseModules.id, id)).returning();
  if (row) {
    await audit(admin.id, "delete", "module", row.courseId, { title: row.title });
    await bustCourse(row.courseId);
  }
  refresh();
}

/* ───────────── Lessons ───────────── */

export async function addLesson(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("courses");
  const moduleId = str(fd, "moduleId");
  const title = str(fd, "title");
  if (title.length < 2) return { ok: false, message: "Give the lesson a title." };
  const [mod] = await db.select().from(schema.courseModules).where(eq(schema.courseModules.id, moduleId)).limit(1);
  if (!mod) return { ok: false, message: "Module not found." };
  const [{ m }] = await db.select({ m: max(schema.lessons.position) }).from(schema.lessons).where(eq(schema.lessons.moduleId, moduleId));
  const [row] = await db
    .insert(schema.lessons)
    .values({ courseId: mod.courseId, moduleId, title, position: (m ?? -1) + 1, published: false })
    .returning({ id: schema.lessons.id });
  await audit(admin.id, "create", "lesson", row.id);
  await bustCourse(mod.courseId);
  redirect(`/admin/courses/${mod.courseId}/lessons/${row.id}?created=1`);
}

export async function saveLesson(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("courses");
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (title.length < 2) return { ok: false, message: "Give the lesson a title." };
  const videoUrl = optional(fd, "videoUrl");
  if (videoUrl && !/^https:\/\//i.test(videoUrl)) return { ok: false, message: "The video link must start with https://" };
  const [row] = await db
    .update(schema.lessons)
    .set({
      title,
      videoUrl,
      body: str(fd, "body"),
      durationMinutes: int(fd, "durationMinutes"),
      isPreview: bool(fd, "isPreview"),
      published: bool(fd, "published"),
      moduleId: str(fd, "moduleId") || undefined,
    })
    .where(eq(schema.lessons.id, id))
    .returning();
  if (!row) return { ok: false, message: "Lesson not found." };
  await audit(admin.id, "update", "lesson", id);
  updateTag(`lesson:${id}`);
  await bustCourse(row.courseId);
  refresh();
  return { ok: true, message: row.published ? "Saved. Learners can see this lesson." : "Saved as hidden. Tick “Visible to learners” when it is ready." };
}

export async function moveLesson(fd: FormData) {
  await guard("courses");
  const id = str(fd, "id");
  const dir = str(fd, "dir");
  const [les] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, id)).limit(1);
  if (!les) return;
  const [swap] = await db
    .select()
    .from(schema.lessons)
    .where(and(eq(schema.lessons.moduleId, les.moduleId), dir === "up" ? lt(schema.lessons.position, les.position) : gt(schema.lessons.position, les.position)))
    .orderBy(dir === "up" ? desc(schema.lessons.position) : asc(schema.lessons.position))
    .limit(1);
  if (!swap) return;
  await db.update(schema.lessons).set({ position: swap.position }).where(eq(schema.lessons.id, les.id));
  await db.update(schema.lessons).set({ position: les.position }).where(eq(schema.lessons.id, swap.id));
  await bustCourse(les.courseId);
  refresh();
}

export async function deleteLesson(fd: FormData) {
  const admin = await guard("courses");
  const id = str(fd, "id");
  const resources = await db
    .select({ key: schema.media.key, mediaId: schema.media.id })
    .from(schema.lessonResources)
    .innerJoin(schema.media, eq(schema.media.id, schema.lessonResources.mediaId))
    .where(eq(schema.lessonResources.lessonId, id));
  const [row] = await db.delete(schema.lessons).where(eq(schema.lessons.id, id)).returning();
  for (const r of resources) {
    await db.delete(schema.media).where(eq(schema.media.id, r.mediaId));
    await deleteStoredFile(r.key);
  }
  if (row) {
    await audit(admin.id, "delete", "lesson", id, { title: row.title });
    await bustCourse(row.courseId);
    redirect(`/admin/courses/${row.courseId}?deleted=1`);
  }
  refresh();
}

/* ───────────── Lesson resources (private files) ───────────── */

export async function addResource(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await guard("courses");
  const lessonId = str(fd, "lessonId");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a file to upload." };
  try {
    const media = await storePrivateFile(file, admin.id);
    await db.insert(schema.lessonResources).values({
      lessonId,
      mediaId: media.id,
      label: str(fd, "label") || file.name,
      allowDownload: bool(fd, "allowDownload"),
    });
    await audit(admin.id, "upload", "lesson_resource", lessonId, { name: file.name });
    updateTag(`lesson:${lessonId}`);
    refresh();
    return { ok: true, message: "File uploaded. Only learners with access to this course can open it." };
  } catch (e) {
    return { ok: false, message: errMsg(e) };
  }
}

export async function deleteResource(fd: FormData) {
  const admin = await guard("courses");
  const id = str(fd, "id");
  const [res] = await db.delete(schema.lessonResources).where(eq(schema.lessonResources.id, id)).returning();
  if (res) {
    const [m] = await db.delete(schema.media).where(eq(schema.media.id, res.mediaId)).returning();
    if (m) await deleteStoredFile(m.key);
    await audit(admin.id, "delete", "lesson_resource", res.lessonId);
    updateTag(`lesson:${res.lessonId}`);
  }
  refresh();
}
