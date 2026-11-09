import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { WebinarRow, type WebinarListItem } from "@/components/webinars/webinar-row";
import { type CourseListItem } from "@/components/courses/course-card";
import { CourseRail } from "./course-rail";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { ArrowRight } from "@/components/ui/icons";

/*
 * What is on right now: the next webinars, then the courses.
 *
 * Two bands rather than one, with different backgrounds, so the eye can tell
 * where the free monthly sessions end and the paid self-paced courses begin.
 * They used to run together on one white field and read as a single long list.
 */
export function Learning({ webinars, courses }: { webinars: WebinarListItem[]; courses: CourseListItem[] }) {
  return (
    <>
      <section aria-labelledby="learn-title" className="bg-mist section">
        <div className="container-x">
          <div className={`grid gap-12 lg:grid-cols-12 ${webinars.length ? "" : "lg:items-center"}`}>
            <Reveal className="lg:col-span-4">
              <p className="kicker">Learn with KSA</p>
              <h2 id="learn-title" className="mt-4 section-title">
                Free monthly research webinars
              </h2>
              <p className="mt-5 leading-relaxed text-muted">
                Several free sessions each month on Zoom, covering research planning, methodology, data analysis and academic
                writing. Create a free account to save your place.
              </p>
              <Link href="/webinars" className="btn btn-ghost group mt-7 bg-white">
                All webinars <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-8">
              {webinars.length ? (
                <div className="overflow-hidden rounded-[1.4rem] bg-white px-6 ring-1 ring-line sm:px-8">
                  {webinars.map((w) => (
                    <WebinarRow key={w.id} w={w} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.4rem] bg-white p-8 ring-1 ring-line sm:p-10">
                  <p className="font-display text-2xl text-ink">The next sessions are being scheduled</p>
                  <p className="mt-2 max-w-lg text-muted">
                    New webinars are announced every month. Subscribe and we will email you as soon as registration opens.
                  </p>
                  <div className="mt-6 max-w-lg">
                    <NewsletterForm source="home_webinars" tone="light" />
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {courses.length ? (
        <section aria-label="Self-paced online courses" className="bg-white section">
          <div className="container-x">
            <CourseRail courses={courses} />
          </div>
        </section>
      ) : null}
    </>
  );
}
