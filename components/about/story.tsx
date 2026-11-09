import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CountUp } from "@/components/ui/count-up";
import { companyPillars, companyStats, milestones, practicalSupport, residency } from "@/lib/content";

/*
 * The parts of the About page that carry the academy's record: the figures, the
 * residential writing programme, the training actually delivered, and the dates.
 *
 * Every word and every number here comes from the client's own "Our Story"
 * document through lib/content.ts. Nothing is rephrased into a bigger claim, and
 * the caveat under the residency stays, because it is the honest part: the
 * programme produces a manuscript ready to submit, not a guaranteed publication.
 */

/**
 * The figures, in boxes outlined in the academy's blue, each number counting up
 * from zero the first time it comes into view.
 *
 * `compact` drops the explanatory third line and shows four of the five, which
 * is the version the homepage uses beside the about text.
 */
export function StatsBand({ compact = false, tone = "white" }: { compact?: boolean; tone?: "white" | "mist" }) {
  const stats = compact ? companyStats.filter((s) => s.small !== "Free webinars") : companyStats;
  return (
    <section aria-labelledby="record-title" className={`${tone === "mist" ? "bg-mist" : "bg-white"} py-14 sm:py-16`}>
      <div className="container-x">
        <h2 id="record-title" className="sr-only">
          Our record
        </h2>
        <RevealGroup className={`grid gap-4 sm:grid-cols-2 ${compact ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
          {stats.map((s) => (
            <RevealItem
              key={s.small}
              className="group h-full rounded-[1.25rem] border border-blue/35 bg-white p-6 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-blue hover:shadow-lift"
            >
              {/* A short rule in the brand blue above each figure, growing on hover. */}
              <span aria-hidden className="block h-[3px] w-9 bg-blue transition-[width] duration-300 group-hover:w-14" />
              <p className="mt-5 font-display text-[clamp(2rem,3.4vw,2.6rem)] font-bold leading-none text-blue">
                <CountUp value={s.value} suffix={s.suffix} />
                {s.unit ? <span className="ml-1.5 text-[0.95rem] font-semibold">{s.unit}</span> : null}
              </p>
              <p className="mt-3 font-display text-[0.98rem] leading-snug text-ink">{s.small}</p>
              {compact ? null : <p className="mt-2 text-sm leading-relaxed text-muted">{s.note}</p>}
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/**
 * "Research support. Focused writing. Practical progress." set as the three
 * things it is, rather than buried in one line of a heading.
 */
export function Pillars({ tone = "mist" }: { tone?: "white" | "mist" }) {
  return (
    <section aria-label="What we do" className={`${tone === "mist" ? "bg-mist" : "bg-white"} py-10`}>
      <div className="container-x">
        <RevealGroup className="grid gap-px overflow-hidden rounded-[1.25rem] border border-blue/35 bg-blue/20 sm:grid-cols-3">
          {companyPillars.map((p) => (
            <RevealItem key={p} className={`${tone === "mist" ? "bg-mist" : "bg-white"} px-6 py-7 text-center`}>
              <p className="font-display text-[1.15rem] font-semibold leading-snug text-ink sm:text-[1.25rem]">{p}</p>
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
        {/* A list, because the client's document lists it: one line each, in order,
            with the figure leading. No invented explanation is added under them. */}
        <RevealGroup as="ul" className="mt-10 max-w-3xl divide-y divide-line border-y border-line">
          {practicalSupport.map((p, i) => (
            <RevealItem as="li" key={p.lead} className="group flex gap-5 py-6">
              <span className="mt-1 font-display text-sm font-semibold tracking-[0.18em] text-blue">{String(i + 1).padStart(2, "0")}</span>
              <p className="text-[1.05rem] leading-relaxed text-ink">
                <strong className="font-display font-semibold">{p.lead}</strong>
                {p.text ? <span className="text-muted">, {p.text}</span> : "."}
              </p>
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
