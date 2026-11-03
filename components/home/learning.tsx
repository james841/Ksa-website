import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { WebinarRow, type WebinarListItem } from "@/components/webinars/webinar-row";
import { CourseCard, type CourseListItem } from "@/components/courses/course-card";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { ArrowRight } from "@/components/ui/icons";

export function Learning({ webinars, courses }: { webinars: WebinarListItem[]; courses: CourseListItem[] }) {
  return (
    <section aria-labelledby="learn-title" className="bg-white section">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="kicker">Learn with KSA</p>
            <h2 id="learn-title" className="mt-4 section-title">
              Free monthly research webinars
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              Several free sessions each month on Zoom, covering research planning, methodology, data analysis and academic
              writing. Create a free account to save your place.
            </p>
            <Link href="/webinars" className="btn btn-ghost group mt-7">
              All webinars <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-8">
            {webinars.length ? (
              <div className="border-b border-line">
                {webinars.map((w) => (
                  <WebinarRow key={w.id} w={w} />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.4rem] bg-mist p-8 sm:p-10">
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

        {courses.length ? (
          <div className="mt-24">
            <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="kicker">Self-paced online courses</p>
                <h3 className="mt-4 max-w-xl text-[1.6rem] leading-tight text-ink sm:text-[1.9rem]">
                  Learn at your pace. Move your research forward.
                </h3>
              </div>
              <Link href="/courses" className="btn btn-ghost group shrink-0 self-start sm:self-auto">
                Browse courses <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <Reveal delay={0.08}>
              <ul className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8">
                {courses.slice(0, 8).map((c) => (
                  <li key={c.id} className="w-[82%] shrink-0 snap-start sm:w-[45%] lg:w-[23.5%]">
                    <CourseCard c={c} />
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        ) : null}
      </div>
    </section>
  );
}
