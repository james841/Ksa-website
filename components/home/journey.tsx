import Link from "next/link";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { processSteps } from "@/lib/content";
import { ArrowRight } from "@/components/ui/icons";

/** How working with KSA goes, in four steps (the #01 to #04 row from the reference design). */
export function Journey() {
  return (
    <section aria-labelledby="journey-title" className="section relative bg-mist">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker justify-center">Across the research journey</p>
          <h2 id="journey-title" className="section-title mt-4">
            Support at every stage of your research
          </h2>
          <p className="section-lead">
            From choosing a topic to analysing data and preparing a manuscript, each service is shaped around your study, your
            discipline and your deadlines.
          </p>
        </Reveal>

        <RevealGroup className="relative mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* The thread that joins the steps on large screens. */}
          <span aria-hidden className="absolute left-[12%] right-[12%] top-9 hidden border-t border-dashed border-blue/30 lg:block" />
          {processSteps.map((s, i) => (
            <RevealItem key={s.title}>
              <div className="group relative h-full rounded-2xl border border-mist-200 bg-white p-6 text-left shadow-soft transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-blue/40">
                <span className="relative grid size-12 place-items-center rounded-xl bg-ink font-display text-sm font-semibold text-white transition-colors group-hover:bg-blue">
                  #{String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-lg text-ink">{s.title}</h3>
                <p className="mt-2 text-[0.94rem] leading-relaxed text-muted">{s.text}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-12 text-center">
          <Link
            href="/services"
            className="group inline-flex items-center gap-3 rounded-full border border-line bg-white py-1.5 pl-5 pr-1.5 font-display text-sm font-semibold text-ink shadow-soft transition-colors hover:border-ink"
          >
            See all services
            <span className="grid size-8 place-items-center rounded-full bg-blue text-white transition-transform group-hover:-rotate-45">
              <ArrowRight size={16} />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
