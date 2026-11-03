import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyWebinars } from "@/lib/data/dashboard";
import { LocalTime } from "@/components/ui/local-time";
import { Video } from "@/components/ui/icons";
import { nowMs } from "@/lib/now";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export default function MyWebinars() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.5rem] bg-white" />}>
      <List />
    </Suspense>
  );
}

async function List() {
  const user = (await getCurrentUser())!;
  const { upcoming, past } = await getMyWebinars(user.id);
  return (
    <div className="space-y-8">
      <h1 className="text-[clamp(2rem,4vw,2.8rem)] text-ink">My webinars</h1>
      {upcoming.length ? (
        <ul className="space-y-4">
          {upcoming.map((w) => {
            const soon = w.startsAt.getTime() - nowMs() < 30 * 60_000;
            return (
              <li key={w.id} className="rounded-[1.4rem] bg-white p-6 ring-1 ring-line">
                <p className="text-sm text-muted"><LocalTime iso={w.startsAt.toISOString()} /></p>
                <Link href={`/webinars/${w.slug}`} className="mt-1 block font-display text-2xl text-ink hover:text-blue">{w.title}</Link>
                {w.status === "cancelled" ? (
                  <p className="mt-3 font-semibold text-danger">This webinar was cancelled.</p>
                ) : w.meetingUrl ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <a href={w.meetingUrl} target="_blank" rel="noopener" className={`btn ${soon ? "btn-primary" : "btn-dark"} btn-sm`}>
                      <Video size={16} /> Join on Zoom
                    </a>
                    {w.meetingDetails ? <p className="text-sm text-muted">{w.meetingDetails}</p> : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted">The joining link will appear here and be emailed to you before the session.</p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-[1.5rem] bg-white p-10 text-center ring-1 ring-line">
          <p className="font-display text-2xl text-ink">No upcoming webinars</p>
          <Link href="/webinars" className="btn btn-dark mt-6">Find a webinar</Link>
        </div>
      )}
      {past.length ? (
        <div>
          <h2 className="font-display text-2xl text-ink">Attended</h2>
          <ul className="mt-3 divide-y divide-line rounded-[1.4rem] bg-white ring-1 ring-line">
            {past.map((w) => (
              <li key={w.id} className="flex flex-col justify-between gap-1 p-5 sm:flex-row">
                <Link href={`/webinars/${w.slug}`} className="font-medium text-ink hover:text-blue">{w.title}</Link>
                <span className="text-sm text-muted"><LocalTime iso={w.startsAt.toISOString()} mode="date" /></span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
