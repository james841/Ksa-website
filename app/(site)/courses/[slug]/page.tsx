import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { getCourseBySlug } from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Cover } from "@/components/ui/cover";
import { EnrollButton, NotifyButton, PayButton } from "@/components/courses/course-actions";
import { formatPrice, paymentsEnabled } from "@/lib/payments/payfast";
import { JsonLd } from "@/components/seo/json-ld";
import { markdownToHtml } from "@/lib/email";
import { Book, Check, Clock, Lock, Play } from "@/components/ui/icons";
import { absoluteUrl, siteUrl } from "@/lib/utils";

const levelLabel: Record<string, string> = { all: "All levels", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCourseBySlug(slug);
  if (!data) return { title: "Course not found", robots: { index: false } };
  const c = data.course;
  return {
    title: `${c.title.split(":")[0]} (Online Course)`,
    description: c.summary,
    alternates: { canonical: `/courses/${c.slug}` },
    openGraph: { url: `/courses/${c.slug}`, title: c.title, description: c.summary, ...(c.coverImage ? { images: [c.coverImage] } : {}) },
  };
}

export default function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  return (
    <Suspense fallback={<div className="h-[60vh] animate-pulse bg-mist" />}>
      <CourseDetail params={params} />
    </Suspense>
  );
}

async function CourseDetail({ params }: Pick<PageProps<"/courses/[slug]">, "params">) {
  const { slug } = await params;
  const data = await getCourseBySlug(slug);
  if (!data) notFound();
  const { course: c, modules } = data;
  const [main, sub] = c.title.split(/:\s*/);
  const lessonCount = modules.reduce((n, m) => n + m.lessons.length, 0);
  const minutes = modules.reduce((n, m) => n + m.lessons.reduce((k, l) => k + (l.durationMinutes ?? 0), 0), 0);
  const soon = c.status === "coming_soon";

  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-x grid gap-10 pb-16 pt-10 lg:grid-cols-12 lg:pb-20">
          <div className="lg:col-span-7">
            <Breadcrumbs tone="light" items={[{ name: "Courses", path: "/courses" }, { name: main, path: `/courses/${c.slug}` }]} />
            <div className="mt-10 flex flex-wrap gap-2 text-xs font-semibold">
              <span className={`rounded-full px-3 py-1 ${soon ? "bg-white text-ink" : "bg-blue"}`}>{soon ? "Coming soon" : "Available now"}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{c.category}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{levelLabel[c.level]}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Self-paced</span>
            </div>
            <h1 className="mt-5 text-[clamp(2.2rem,5.4vw,3.8rem)] leading-[1.1]">{main}</h1>
            {sub ? <p className="mt-3 font-display text-2xl text-blue-100">{sub}</p> : null}
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{c.summary}</p>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              {lessonCount ? <li className="flex items-center gap-2"><Book size={16} /> {lessonCount} lesson{lessonCount === 1 ? "" : "s"}</li> : null}
              {c.durationLabel || minutes ? <li className="flex items-center gap-2"><Clock size={16} /> {c.durationLabel ?? `${Math.round(minutes / 6) / 10} hours`}</li> : null}
              {c.instructorName ? <li>Taught by {c.instructorName}</li> : null}
            </ul>
          </div>
          <div className="lg:col-span-5">
            <Cover title={c.title} label={c.category} image={c.coverImage} className="aspect-[16/11] rounded-[1.6rem]" sizes="(max-width:1024px) 92vw, 480px" priority />
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="space-y-14 lg:col-span-7">
            {c.description && c.description !== c.summary ? (
              <div>
                <h2 className="font-display text-3xl text-ink">About this course</h2>
                <div className="prose-ksa mt-5" dangerouslySetInnerHTML={{ __html: markdownToHtml(c.description) }} />
              </div>
            ) : null}
            {c.outcomes.length ? (
              <div className="rounded-[1.5rem] bg-mist p-7 ring-1 ring-line">
                <h2 className="font-display text-2xl text-ink">What you will learn</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {c.outcomes.map((o) => (
                    <li key={o} className="flex gap-3 text-ink/85">
                      <Check size={18} className="mt-0.5 shrink-0 text-blue" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <h2 className="font-display text-3xl text-ink">Course content</h2>
              {modules.length ? (
                <ol className="mt-6 space-y-4">
                  {modules.map((mod, i) => (
                    <li key={mod.id} className="overflow-hidden rounded-[1.25rem] ring-1 ring-line">
                      <div className="flex items-center justify-between gap-4 bg-mist px-5 py-4">
                        <p className="font-semibold text-ink">
                          <span className="mr-2 text-blue">Module {i + 1}</span>
                          {mod.title}
                        </p>
                        <span className="shrink-0 text-sm text-muted">{mod.lessons.length} lesson{mod.lessons.length === 1 ? "" : "s"}</span>
                      </div>
                      <ul className="divide-y divide-line">
                        {mod.lessons.map((l) => (
                          <li key={l.id} className="flex items-center gap-3 px-5 py-3.5 text-[0.95rem]">
                            {l.isPreview ? <Play size={16} className="text-blue" /> : <Lock size={16} className="text-muted" />}
                            <span className="flex-1 text-ink/85">{l.title}</span>
                            {l.isPreview && !soon ? (
                              <Link href={`/learn/${c.slug}/${l.id}`} className="text-sm font-semibold text-blue hover:underline">Preview</Link>
                            ) : null}
                            {l.durationMinutes ? <span className="text-sm text-muted">{l.durationMinutes} min</span> : null}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 text-muted">The full lesson outline will be published ahead of launch.</p>
              )}
            </div>
            {c.instructorName ? (
              <div>
                <h2 className="font-display text-3xl text-ink">Your instructor</h2>
                <p className="mt-4 font-semibold text-ink">{c.instructorName}</p>
                {c.instructorBio ? <p className="mt-2 leading-relaxed text-muted">{c.instructorBio}</p> : null}
              </div>
            ) : null}
          </div>
          <aside className="lg:col-span-5">
            <div className="sticky top-28 rounded-[1.5rem] bg-white p-7 shadow-lift ring-1 ring-line">
              {!soon && c.priceCents > 0 ? (
                <p className="mb-1 font-display text-[2.1rem] leading-none text-ink">{formatPrice(c.priceCents, c.currency)}</p>
              ) : null}
              <p className="font-display text-2xl text-ink">
                {soon ? "This course is coming soon" : c.priceCents > 0 ? "Pay once, keep access" : "Start learning today"}
              </p>
              <p className="mb-6 mt-2 text-sm text-muted">
                {soon
                  ? "Final offerings and enrolment details will be announced ahead of launch. Ask to be notified and we will email you first."
                  : c.priceCents > 0
                    ? "One payment through PayFast. Your place is confirmed as soon as the payment goes through, and your progress is saved as you learn."
                    : c.enrollmentMode === "open"
                      ? "Enrol with your free KSA account and learn at your own pace. Your progress is saved automatically."
                      : "Access to this course is arranged by KSA. Contact us to request a place."}
              </p>
              <Suspense fallback={<div className="h-12 animate-pulse rounded-full bg-mist" />}>
                <CourseAccess courseId={c.id} slug={c.slug} soon={soon} mode={c.enrollmentMode} priceCents={c.priceCents} currency={c.currency} />
              </Suspense>
            </div>
          </aside>
        </div>
      </section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: c.title,
          description: c.summary,
          url: absoluteUrl(`/courses/${c.slug}`),
          provider: { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: "Knowledge Space Academy", sameAs: siteUrl },
          inLanguage: "en",
          educationalLevel: levelLabel[c.level],
          ...(soon
            ? {}
            : {
                isAccessibleForFree: c.priceCents === 0 && c.enrollmentMode === "open",
                hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: c.durationLabel ?? undefined },
                offers:
                  c.priceCents > 0
                    ? { "@type": "Offer", category: "Paid", price: (c.priceCents / 100).toFixed(2), priceCurrency: c.currency }
                    : { "@type": "Offer", category: c.enrollmentMode === "open" ? "Free" : "Partner", price: 0, priceCurrency: c.currency },
              }),
        }}
      />
    </>
  );
}

async function CourseAccess({
  courseId,
  slug,
  soon,
  mode,
  priceCents,
  currency,
}: {
  courseId: string;
  slug: string;
  soon: boolean;
  mode: string;
  priceCents: number;
  currency: string;
}) {
  const user = await getCurrentUser();
  const next = encodeURIComponent(`/courses/${slug}`);
  if (!user) {
    return (
      <div className="space-y-3">
        <Link href={`/register?next=${next}`} className="btn btn-primary w-full py-3.5">
          {soon ? "Create an account to get notified" : "Create a free account to enrol"}
        </Link>
        <Link href={`/login?next=${next}`} className="btn btn-ghost w-full">I already have an account</Link>
      </div>
    );
  }
  if (soon) {
    const [row] = await db
      .select({ c: sql<number>`1` })
      .from(schema.courseInterest)
      .where(and(eq(schema.courseInterest.courseId, courseId), eq(schema.courseInterest.userId, user.id)))
      .limit(1);
    return <NotifyButton slug={slug} already={!!row} />;
  }
  const [enr] = await db
    .select()
    .from(schema.enrollments)
    .where(and(eq(schema.enrollments.courseId, courseId), eq(schema.enrollments.userId, user.id)))
    .limit(1);
  if (enr) {
    const target = enr.lastLessonId ? `/learn/${slug}/${enr.lastLessonId}` : `/learn/${slug}`;
    return (
      <Link href={target} className="btn btn-primary w-full py-3.5">
        {enr.completedAt ? "Review the course" : "Continue learning"}
      </Link>
    );
  }
  if (priceCents > 0) {
    if (!paymentsEnabled()) {
      return (
        <Link href="/contact" className="btn btn-dark w-full py-3.5">
          Contact us to enrol
        </Link>
      );
    }
    return <PayButton slug={slug} label={`Pay ${formatPrice(priceCents, currency)} with PayFast`} />;
  }
  if (mode !== "open" && user.role !== "admin") {
    return <Link href={`/contact`} className="btn btn-dark w-full py-3.5">Request access</Link>;
  }
  return <EnrollButton slug={slug} />;
}
