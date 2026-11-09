import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { companyStats, milestones, practicalSupport, residency } from "@/lib/content";

/*
 * The parts of the About page that carry the academy's record: the figures, the
 * residential writing programme, the training actually delivered, and the dates.
 *
 * Every word and every number here comes from the client's own "Our Story"
 * document through lib/content.ts. Nothing is rephrased into a bigger claim, and
 * the caveat under the residency stays, because it is the honest part: the
 * programme produces a manuscript ready to submit, not a guaranteed publication.
 */

/** The five figures, as a band of hairline-separated columns. */
export function StatsBand() {
  return (
    <section aria-labelledby="record-title" className="border-y border-line bg-white py-14 sm:py-16">
      <div className="container-x">
        <h2 id="record-title" className="sr-only">
          Our record
        </h2>
        <RevealGroup className="grid gap-y-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-y-0">
          {companyStats.map((s, i) => (
            <RevealItem
              key={s.small}
              className={`px-0 sm:px-7 lg:px-6 ${i > 0 ? "sm:border-l sm:border-line" : ""} ${i === 2 ? "lg:border-l" : "sm:even:border-l"} first:sm:pl-0 last:lg:pr-0`}
            >
              <p className="font-display text-[clamp(1.9rem,3.2vw,2.4rem)] leading-none text-ink">{s.big}</p>
              <p className="mt-2.5 font-display text-[0.95rem] leading-snug text-ink">{s.small}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.note}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/** The five-day residential writing programme, with its caveat kept in plain sight. */
export function Residency() {
  return (
    <section aria-labelledby="residency-title" className="bg-ink py-20 text-white sm:py-24">
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <p className="kicker text-white/55">Residential writing programme</p>
          <h2 id="residency-title" className="mt-4 font-display text-[clamp(1.9rem,3.6vw,2.6rem)] leading-[1.15]">
            {residency.title}
          </h2>
        </Reveal>
        <div className="space-y-6 lg:col-span-7">
          <Reveal delay={0.08}>
            <p className="text-lg leading-relaxed text-white/80">{residency.body}</p>
          </Reveal>
          <Reveal delay={0.12}>
            {/* Set apart rather than hidden: the limit of the promise belongs next to the promise. */}
            <p className="border-l-2 border-white/25 pl-5 text-[0.95rem] leading-relaxed text-white/60">{residency.caveat}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Mentoring and training delivered, each with the figure first. */
export function PracticalSupport() {
  return (
    <section aria-labelledby="support-title" className="bg-white py-20 sm:py-24">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <p className="kicker">What we have delivered</p>
          <h2 id="support-title" className="mt-4 section-title">
            Practical support across the research journey
          </h2>
        </Reveal>
        <RevealGroup className="mt-12 grid gap-5 lg:grid-cols-3">
          {practicalSupport.map((p) => (
            <RevealItem
              key={p.lead}
              className="group h-full rounded-[1.4rem] bg-mist p-7 ring-1 ring-line transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span aria-hidden className="block h-[2px] w-10 bg-blue transition-[width] duration-300 group-hover:w-16" />
              <p className="mt-6 font-display text-xl leading-snug text-ink">{p.lead}</p>
              <p className="mt-3 leading-relaxed text-muted">{p.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/** The dates, on a single rule, so the growth reads at a glance. */
export function Milestones() {
  return (
    <section aria-labelledby="milestones-title" className="bg-white py-20 sm:py-24">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <p className="kicker">Our milestones</p>
          <h2 id="milestones-title" className="mt-4 section-title">
            How the academy has grown
          </h2>
        </Reveal>
        <RevealGroup className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* One continuous rule with a marker per year, drawn only where it reads well. */}
          <span aria-hidden className="absolute left-0 right-0 top-[7px] hidden border-t border-line lg:block" />
          {milestones.map((m) => (
            <RevealItem key={m.year} className="relative lg:pr-8">
              <span aria-hidden className="mb-6 hidden size-[15px] rounded-full border-[3px] border-white bg-blue lg:block" />
              <p className="font-display text-2xl leading-none text-blue">{m.year}</p>
              <p className="mt-3 font-display text-lg leading-snug text-ink">{m.title}</p>
              <p className="mt-2 leading-relaxed text-muted">{m.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
