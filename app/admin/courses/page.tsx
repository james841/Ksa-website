import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { Badge, EmptyState, PageHeader } from "@/components/admin/ui";
import { Book, Plus, Users } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Courses" };

export default async function CoursesAdmin() {
  await requirePermission("courses");
  const rows = await db
    .select({
      id: schema.courses.id,
      title: schema.courses.title,
      subtitle: schema.courses.subtitle,
      status: schema.courses.status,
      enrollmentMode: schema.courses.enrollmentMode,
      coverImage: schema.courses.coverImage,
      category: schema.courses.category,
      lessons: sql<number>`(select count(*)::int from lessons l where l.course_id = "courses"."id")`,
      learners: sql<number>`(select count(*)::int from enrollments e where e.course_id = "courses"."id")`,
      interested: sql<number>`(select count(*)::int from course_interest i where i.course_id = "courses"."id")`,
    })
    .from(schema.courses)
    .orderBy(asc(schema.courses.position), asc(schema.courses.title));

  return (
    <>
      <PageHeader
        title="Courses"
        description="Build self-paced courses: modules, lessons, videos and private downloads. Content lives in your own database and storage."
        actions={
          <Link href="/admin/courses/new" className="btn btn-primary btn-sm">
            <Plus size={16} /> New course
          </Link>
        }
      />
      {rows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <Link key={c.id} href={`/admin/courses/${c.id}`} className="group overflow-hidden rounded-[1.25rem] border border-line bg-white transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(11,20,51,.45)]">
              <div className="relative aspect-[16/8] bg-ink">
                {c.coverImage ? (
                  <Image src={c.coverImage} alt="" fill sizes="(max-width:640px) 100vw, 360px" className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-white/30">
                    <Book size={40} />
                  </span>
                )}
                <span className="absolute left-3 top-3">
                  <Badge value={c.status} />
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{c.category}</p>
                <h2 className="mt-1 text-lg leading-snug text-ink group-hover:text-blue">{c.title}</h2>
                {c.subtitle ? <p className="mt-0.5 line-clamp-1 text-sm text-muted">{c.subtitle}</p> : null}
                <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span>{c.lessons} lesson{c.lessons === 1 ? "" : "s"}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={14} /> {c.learners} learner{c.learners === 1 ? "" : "s"}
                  </span>
                  {c.status === "coming_soon" ? <span>{c.interested} waiting</span> : null}
                  {c.enrollmentMode === "invite" ? <span>Invite only</span> : null}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No courses yet" text="Run “npm run db:seed” to load the 14 planned courses, or create your first one." />
      )}
    </>
  );
}
