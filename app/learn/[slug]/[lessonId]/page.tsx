import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourseForLearner, getLessonContent } from "@/lib/data/learning";
import { markdownToHtml } from "@/lib/email";
import { toEmbedUrl, cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { LessonCompleteButton } from "@/components/courses/lesson-complete";
import { LessonVideo } from "@/components/courses/lesson-video";
import { DataSaverToggle } from "@/components/ui/data-saver-toggle";
import { ArrowLeft, ArrowRight, Check, Download, File, Lock, Play, X } from "@/components/ui/icons";

const fileSize = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export default function LessonPage({ params }: PageProps<"/learn/[slug]/[lessonId]">) {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-muted">Loading lesson…</div>}>
      <Lesson params={params} />
    </Suspense>
  );
}

async function Lesson({ params }: Pick<PageProps<"/learn/[slug]/[lessonId]">, "params">) {
  const { slug, lessonId } = await params;
  const user = await getCurrentUser();
  const data = await getCourseForLearner(slug, user);
  if (!data) notFound();
  const meta = data.ordered.find((l) => l.id === lessonId);
  if (!meta) notFound();

  // Server-side access check: enrolled learners and admins see everything; others only preview lessons.
  if (!data.hasAccess && !meta.isPreview) {
    redirect(user ? `/courses/${slug}` : `/login?next=${encodeURIComponent(`/learn/${slug}/${lessonId}`)}`);
  }

  const content = await getLessonContent(lessonId);
  if (!content) notFound();
  const { lesson, resources } = content;
  const idx = data.ordered.findIndex((l) => l.id === lessonId);
  const prev = data.ordered[idx - 1];
  const next = data.ordered[idx + 1];
  const canOpen = (l: { isPreview: boolean }) => data.hasAccess || l.isPreview;
  const embed = toEmbedUrl(lesson.videoUrl);
  const total = data.ordered.length;
  const done = data.ordered.filter((l) => data.completed.has(l.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  // Audio files play right on the page; everything else is listed as a download.
  const audio = data.hasAccess ? resources.filter((r) => r.mime.startsWith("audio/")) : [];
  const files = resources.filter((r) => !r.mime.startsWith("audio/"));
  const words = lesson.body ? lesson.body.split(/\s+/).length : 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <Logo className="hidden h-7 w-auto sm:block" />
          <span className="hidden h-6 w-px bg-line sm:block" />
          <p className="min-w-0 flex-1 truncate font-display text-lg text-ink">{data.course.title.split(":")[0]}</p>
          {data.hasAccess ? (
            <div className="hidden items-center gap-3 md:flex">
              <div className="h-2 w-40 overflow-hidden rounded-full bg-mist-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
                <div className="h-full rounded-full bg-blue" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-sm text-muted">{pct}% complete</span>
            </div>
          ) : null}
          <DataSaverToggle tone="light" className="hidden sm:inline-flex" />
          <Link href={user ? "/dashboard/courses" : `/courses/${slug}`} className="grid size-10 place-items-center rounded-full hover:bg-mist" aria-label="Close the course player">
            <X size={20} />
          </Link>
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[340px_1fr]">
        <nav aria-label="Course lessons" className="order-2 border-r border-line bg-white lg:order-1 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto">
          {data.modules.map((mod, i) => (
            <div key={mod.id} className="border-b border-line">
              <p className="bg-mist px-5 py-3 text-sm font-semibold text-ink">
                <span className="text-blue">Module {i + 1}.</span> {mod.title}
              </p>
              <ul>
                {mod.lessons.map((l) => {
                  const active = l.id === lessonId;
                  const isDone = data.completed.has(l.id);
                  const open = canOpen(l);
                  return (
                    <li key={l.id}>
                      {open ? (
                        <Link
                          href={`/learn/${slug}/${l.id}`}
                          aria-current={active ? "page" : undefined}
                          className={cn("flex items-start gap-3 px-5 py-3 text-sm transition-colors", active ? "bg-blue-50 text-blue" : "text-ink/85 hover:bg-mist")}
                        >
                          <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", isDone ? "bg-success text-white" : "ring-1 ring-line")}>
                            {isDone ? <Check size={12} /> : <Play size={10} />}
                          </span>
                          <span className="flex-1">{l.title}</span>
                          {l.durationMinutes ? <span className="text-xs text-muted">{l.durationMinutes}m</span> : null}
                        </Link>
                      ) : (
                        <span className="flex items-start gap-3 px-5 py-3 text-sm text-muted">
                          <Lock size={16} className="mt-0.5 shrink-0" />
                          <span className="flex-1">{l.title}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <main id="main" className="order-1 lg:order-2">
          {embed ? (
            <div className="bg-coal">
              <div className="mx-auto aspect-video max-w-5xl">
                <LessonVideo embed={embed} title={lesson.title} minutes={meta.durationMinutes ?? null} hasLightOption={audio.length > 0 || words > 80} />
              </div>
            </div>
          ) : null}
          <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
            {!data.hasAccess ? (
              <p className="mb-6 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue">
                You are watching a free preview. <Link href={`/courses/${slug}`} className="font-semibold underline">Enrol</Link> to unlock every lesson.
              </p>
            ) : null}
            <p className="text-sm text-muted">Lesson {idx + 1} of {total}</p>
            <h1 className="mt-2 text-[clamp(1.9rem,4vw,2.8rem)] leading-tight text-ink">{lesson.title}</h1>
            {words ? (
              <p className="mt-3 text-sm text-muted">
                {Math.max(1, Math.round(words / 200))} min read · text notes use almost no data
              </p>
            ) : null}

            {audio.length ? (
              <div className="mt-8 space-y-3 rounded-[1.25rem] bg-white p-5 ring-1 ring-line">
                <p className="font-semibold text-ink">Listen to this lesson</p>
                <p className="-mt-2 text-sm text-muted">Audio uses far less data than video. It only starts downloading when you press play.</p>
                {audio.map((a) => (
                  <div key={a.id}>
                    <p className="mb-1.5 text-sm text-ink">
                      {a.label} <span className="text-muted">· {fileSize(a.size)}</span>
                    </p>
                    <audio controls preload="none" src={`/api/files/${a.id}`} className="w-full">
                      <a href={`/api/files/${a.id}?download=1`}>Download the audio</a>
                    </audio>
                    {a.allowDownload ? (
                      <a href={`/api/files/${a.id}?download=1`} className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue">
                        <Download size={14} /> Download to listen offline
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {lesson.body ? <div className="prose-ksa mt-8" dangerouslySetInnerHTML={{ __html: markdownToHtml(lesson.body) }} /> : null}

            {files.length && data.hasAccess ? (
              <div className="mt-10 rounded-[1.25rem] bg-white p-6 ring-1 ring-line">
                <p className="font-semibold text-ink">Lesson resources</p>
                <ul className="mt-4 space-y-2">
                  {files.map((r) => (
                    <li key={r.id}>
                      <a href={`/api/files/${r.id}${r.allowDownload ? "?download=1" : ""}`} className="flex items-center gap-3 rounded-lg p-2 text-ink hover:bg-mist" target={r.allowDownload ? undefined : "_blank"} rel="noopener">
                        <File size={18} className="text-blue" />
                        <span className="flex-1">{r.label}</span>
                        <span className="text-xs text-muted">{fileSize(r.size)}</span>
                        {r.allowDownload ? <Download size={16} className="text-muted" /> : <span className="text-xs text-muted">View only</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-12 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-line pt-8 sm:flex-row sm:items-center">
              {prev && canOpen(prev) ? (
                <Link href={`/learn/${slug}/${prev.id}`} className="btn btn-ghost">
                  <ArrowLeft size={17} /> Previous
                </Link>
              ) : (
                <span />
              )}
              {data.hasAccess && data.enrollment ? (
                <LessonCompleteButton lessonId={lesson.id} done={data.completed.has(lesson.id)} nextHref={next ? `/learn/${slug}/${next.id}` : null} />
              ) : next && canOpen(next) ? (
                <Link href={`/learn/${slug}/${next.id}`} className="btn btn-primary">
                  Next lesson <ArrowRight size={17} />
                </Link>
              ) : null}
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
