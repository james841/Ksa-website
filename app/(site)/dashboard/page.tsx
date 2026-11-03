import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyCourses, getMyProfile, getMyWebinars } from "@/lib/data/dashboard";
import { DashCard } from "@/components/dashboard/card";
import { ProgressBar } from "@/components/dashboard/progress";
import { ResendVerification } from "@/components/dashboard/resend-verification";
import { LocalTime } from "@/components/ui/local-time";
import { Cover } from "@/components/ui/cover";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export default function DashboardHome({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.5rem] bg-white" />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

async function Overview({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  const user = (await getCurrentUser())!;
  const sp = await searchParams;
  const [courses, webinars, profile] = await Promise.all([getMyCourses(user.id), getMyWebinars(user.id), getMyProfile(user.id)]);
  const current = courses.find((c) => !c.completedAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] text-ink">Welcome, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-muted">Your courses, webinars and account in one place.</p>
      </div>
      {sp.reset ? <p className="rounded-xl bg-[#e8f5ee] px-4 py-3 text-sm font-medium text-success">Your password has been changed.</p> : null}
      {!user.emailVerified ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-[1.25rem] bg-blue-50 p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-ink">Please confirm your email address so we can send you webinar joining links.</p>
          <ResendVerification />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <DashCard title="Continue learning" action={{ href: "/dashboard/courses", label: "All my courses" }}>
          {current ? (
            <div className="flex gap-4">
              <Cover title={current.title} image={current.coverImage} hideTitle className="size-24 shrink-0 rounded-xl" sizes="96px" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{current.title.split(":")[0]}</p>
                <div className="mt-3"><ProgressBar done={current.done} total={current.total} /></div>
                <Link href={current.lastLessonId ? `/learn/${current.slug}/${current.lastLessonId}` : `/learn/${current.slug}`} className="btn btn-primary btn-sm mt-4">
                  Resume
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-muted">You are not enrolled in a course yet.</p>
              <Link href="/courses" className="btn btn-dark btn-sm mt-4">Browse courses</Link>
            </div>
          )}
        </DashCard>

        <DashCard title="Upcoming webinars" action={{ href: "/dashboard/webinars", label: "View all" }}>
          {webinars.upcoming.length ? (
            <ul className="space-y-4">
              {webinars.upcoming.slice(0, 3).map((w) => (
                <li key={w.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                  <Link href={`/webinars/${w.slug}`} className="font-semibold text-ink hover:text-blue">{w.title}</Link>
                  <p className="mt-1 text-sm text-muted"><LocalTime iso={w.startsAt.toISOString()} /></p>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <p className="text-muted">You have no upcoming webinars.</p>
              <Link href="/webinars" className="btn btn-dark btn-sm mt-4">Find a webinar</Link>
            </div>
          )}
        </DashCard>
      </div>

      <DashCard title="Email updates" action={{ href: "/dashboard/settings", label: "Change" }}>
        <p className="text-muted">
          {profile.subscribed
            ? "You receive research tips, webinar announcements and course updates."
            : "You only receive essential account and webinar emails. Turn on updates in your settings to hear about new webinars and courses."}
        </p>
      </DashCard>
    </div>
  );
}
