import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { addResource, deleteLesson, deleteResource, saveLesson } from "@/app/actions/admin/courses";
import { AdminForm, ConfirmAction, MarkdownHint } from "@/components/admin/forms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/forms/fields";
import { toEmbedUrl } from "@/lib/utils";
import { File } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Edit lesson" };

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default async function EditLesson({ params }: PageProps<"/admin/courses/[id]/lessons/[lessonId]">) {
  await requirePermission("courses");
  const { id, lessonId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^[0-9a-f-]{36}$/.test(lessonId)) notFound();
  const [lesson] = await db.select().from(schema.lessons).where(and(eq(schema.lessons.id, lessonId), eq(schema.lessons.courseId, id))).limit(1);
  if (!lesson) notFound();
  const [[course], modules, resources] = await Promise.all([
    db.select({ title: schema.courses.title }).from(schema.courses).where(eq(schema.courses.id, id)).limit(1),
    db.select({ id: schema.courseModules.id, title: schema.courseModules.title }).from(schema.courseModules).where(eq(schema.courseModules.courseId, id)).orderBy(asc(schema.courseModules.position)),
    db
      .select({ id: schema.lessonResources.id, label: schema.lessonResources.label, allowDownload: schema.lessonResources.allowDownload, name: schema.media.originalName, size: schema.media.size })
      .from(schema.lessonResources)
      .innerJoin(schema.media, eq(schema.media.id, schema.lessonResources.mediaId))
      .where(eq(schema.lessonResources.lessonId, lessonId)),
  ]);
  const embed = toEmbedUrl(lesson.videoUrl);

  return (
    <>
      <PageHeader back={{ href: `/admin/courses/${id}`, label: course?.title ?? "Course" }} title={lesson.title} description="Edit the lesson content, video and downloads." />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <AdminForm action={saveLesson} className="space-y-6" successTitle="Lesson saved">
          <input suppressHydrationWarning type="hidden" name="id" value={lesson.id} />
          <Panel title="Lesson">
            <div className="space-y-5">
              <div>
                <label className="field-label" htmlFor="l-title">
                  Title
                </label>
                <input suppressHydrationWarning id="l-title" name="title" required defaultValue={lesson.title} className="field" />
              </div>
              <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
                <div>
                  <label className="field-label" htmlFor="l-mod">
                    Module
                  </label>
                  <select suppressHydrationWarning id="l-mod" name="moduleId" defaultValue={lesson.moduleId} className="field">
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="l-dur">
                    Minutes
                  </label>
                  <input suppressHydrationWarning id="l-dur" name="durationMinutes" type="number" min={1} defaultValue={lesson.durationMinutes ?? ""} className="field" />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="l-video">
                  Video link <span className="font-normal text-muted">(optional)</span>
                </label>
                <input suppressHydrationWarning id="l-video" name="videoUrl" type="url" defaultValue={lesson.videoUrl ?? ""} className="field" placeholder="https://vimeo.com/… or an unlisted YouTube link" />
                <p className="mt-1.5 text-xs text-muted">
                  Use a private Vimeo video limited to your domain (best protection), or Bunny Stream / an unlisted YouTube link. Videos are only shown to learners with access, and only load when the learner presses play. Set the minutes below so learners see how much data it will use.
                </p>
              </div>
              {embed ? (
                <div className="aspect-video overflow-hidden rounded-xl bg-ink">
                  <iframe src={embed} title="Video preview" className="size-full" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy" />
                </div>
              ) : null}
              <div>
                <label className="field-label" htmlFor="l-body">
                  Lesson text <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea suppressHydrationWarning id="l-body" name="body" defaultValue={lesson.body} className="field min-h-80 font-mono text-sm leading-relaxed" placeholder={"## Key ideas\n\nWrite the lesson notes, steps and activities here."} />
                <p className="mt-1.5 text-xs text-muted">
                  <MarkdownHint />
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-xl bg-mist p-4 sm:flex-row sm:gap-8">
                <label className="flex items-start gap-3 text-sm">
                  <input suppressHydrationWarning type="checkbox" name="published" defaultChecked={lesson.published} className="mt-0.5 size-5 accent-blue" />
                  <span>
                    <strong className="block text-ink">Visible to learners</strong>
                    <span className="text-muted">Untick while you are still writing.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input suppressHydrationWarning type="checkbox" name="isPreview" defaultChecked={lesson.isPreview} className="mt-0.5 size-5 accent-blue" />
                  <span>
                    <strong className="block text-ink">Free preview</strong>
                    <span className="text-muted">Anyone signed in can watch it before enrolling.</span>
                  </span>
                </label>
              </div>
              <SubmitButton pendingText="Saving…">Save lesson</SubmitButton>
            </div>
          </Panel>
        </AdminForm>

        <div className="space-y-6">
          <Panel title="Downloads and resources" description="Private files. Only learners with access to this course can open them.">
            {resources.length ? (
              <ul className="mb-5 divide-y divide-line">
                {resources.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-3">
                    <File size={18} className="shrink-0 text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.label}</span>
                      <span className="text-xs text-muted">
                        {r.name} · {kb(r.size)}
                        {!r.allowDownload ? " · view only" : ""}
                      </span>
                    </span>
                    <ConfirmAction action={deleteResource} hidden={{ id: r.id }} label="Remove" confirmLabel="Delete file" success="File deleted" />
                  </li>
                ))}
              </ul>
            ) : null}
            <AdminForm action={addResource} resetOnSuccess successTitle="File uploaded">
              <input suppressHydrationWarning type="hidden" name="lessonId" value={lesson.id} />
              <div>
                <label className="field-label" htmlFor="r-file">
                  File
                </label>
                <input suppressHydrationWarning
                  id="r-file"
                  type="file"
                  name="file"
                  required
                  className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                <p className="mt-1.5 text-xs text-muted">
                  PDF, Word, Excel, PowerPoint, images, CSV, TXT, ZIP or audio (MP3, M4A, OGG). Up to 24MB. Audio files play on the lesson page: export them as mono at
                  48-64 kbps (about 0.4 MB a minute) so learners on mobile data can listen.
                </p>
              </div>
              <div>
                <label className="field-label" htmlFor="r-label">
                  Label <span className="font-normal text-muted">(optional)</span>
                </label>
                <input suppressHydrationWarning id="r-label" name="label" placeholder="e.g. Interview guide template" className="field" />
              </div>
              <label className="flex items-center gap-3 text-sm text-muted">
                <input suppressHydrationWarning type="checkbox" name="allowDownload" defaultChecked className="size-5 accent-blue" />
                Allow download (untick to open in the browser only)
              </label>
              <SubmitButton variant="dark" pendingText="Uploading…">
                Upload file
              </SubmitButton>
            </AdminForm>
          </Panel>
          <Panel title="Danger zone">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">Delete this lesson, its files and learner progress for it.</p>
              <ConfirmAction action={deleteLesson} hidden={{ id: lesson.id }} label="Delete lesson" confirmLabel="Delete permanently" />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
