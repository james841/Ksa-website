import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyCourses } from "@/lib/data/dashboard";
import { ProgressBar } from "@/components/dashboard/progress";
import { Cover } from "@/components/ui/cover";
import { formatDate } from "@/lib/utils";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export default function MyCourses() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.5rem] bg-white" />}>
      <List />
    </Suspense>
  );
}

async function List() {
  const user = (await getCurrentUser())!;
  const courses = await getMyCourses(user.id);
  return (
    <div>
      <h1 className="text-[clamp(2rem,4vw,2.8rem)] text-ink">My courses</h1>
      {courses.length ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2">
          {courses.map((c) => (
            <li key={c.id} className="overflow-hidden rounded-[1.4rem] bg-white ring-1 ring-line">
              <Cover title={c.title} label={c.category} image={c.coverImage} className="aspect-[16/8]" sizes="420px" />
              <div className="p-6">
                <p className="font-display text-xl text-ink">{c.title.split(":")[0]}</p>
                <p className="mt-1 text-xs text-muted">Enrolled {formatDate(c.enrolledAt, true)}{c.completedAt ? ` · Completed ${formatDate(c.completedAt, true)}` : ""}</p>
                <div className="mt-4"><ProgressBar done={c.done} total={c.total} /></div>
                <Link href={c.lastLessonId ? `/learn/${c.slug}/${c.lastLessonId}` : `/learn/${c.slug}`} className="btn btn-primary btn-sm mt-5">
                  {c.completedAt ? "Review" : c.done ? "Resume" : "Start"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-[1.5rem] bg-white p-10 text-center ring-1 ring-line">
          <p className="font-display text-2xl text-ink">No courses yet</p>
          <p className="mt-2 text-muted">Self-paced courses are coming soon. Ask to be notified on any course page.</p>
          <Link href="/courses" className="btn btn-dark mt-6">Browse courses</Link>
        </div>
      )}
    </div>
  );
}
