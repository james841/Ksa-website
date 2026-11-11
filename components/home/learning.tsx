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
      {/* The same deep navy as the footer, so the free sessions stand out as the one
          dark band in the middle of the page rather than another pale panel. */}
      <section aria-labelledby="learn-title" className="bg-ink text-white section">
        <div className="container-x">
          <div className={`grid gap-12 lg:grid-cols-12 ${webinars.length ? "" : "lg:items-center"}`}>
            <Reveal className="lg:col-span-4">
              <p className="kicker text-sky">Learn with KSA</p>
              <h2 id="learn-title" className="mt-4 font-display text-[clamp(1.9rem,3.6vw,2.6rem)] font-bold leading-[1.12] text-white">
                Free monthly research webinars
              </h2>
              <p className="mt-5 leading-relaxed text-white/75">
                Several free sessions each month on Zoom, covering research planning, methodology, data analysis and academic
                writing. Create a free account to save your place.
              </p>
              <Link
                href="/webinars"
                className="btn group mt-7 border border-white/25 bg-transparent text-white transition-colors hover:border-white hover:bg-white hover:text-ink"
              >
                All webinars <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-8">
              {/* The card stays white so the sessions themselves read as the content,
                  with the navy around it doing the work. */}
              {webinars.length ? (
                <div className="overflow-hidden rounded-[1.4rem] bg-white px-6 shadow-lift sm:px-8">
                  {webinars.map((w) => (
                    <WebinarRow key={w.id} w={w} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.4rem] bg-white p-8 shadow-lift sm:p-10">
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
