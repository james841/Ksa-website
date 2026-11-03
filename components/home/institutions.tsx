import Link from "next/link";
import { institutionalServices } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ArrowRight } from "@/components/ui/icons";

export function InstitutionsPreview() {
  return (
    <section aria-labelledby="inst-title" className="paper-grain bg-mist section">
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal className="lg:sticky lg:top-32">
            <p className="kicker">For universities and organisations</p>
            <h2 id="inst-title" className="mt-4 section-title">
              Build research capacity across your institution
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              KSA partners with universities, research institutions, corporate organisations and professional bodies to design,
              deliver and review programmes that respond to the needs of their researchers, faculty and postgraduate students.
            </p>
            <Link href="/institutions" className="btn btn-dark group mt-8">
              Plan a programme with us <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {institutionalServices.map((s) => (
            <RevealItem key={s.slug}>
              <Link
                href={`/institutions#${s.slug}`}
                className="group flex h-full flex-col rounded-[1.4rem] bg-white p-7 shadow-soft ring-1 ring-line transition-shadow hover:shadow-lift"
              >
                <svg width="44" height="28" viewBox="0 0 44 28" fill="none" aria-hidden>
                  <ellipse cx="22" cy="15" rx="20" ry="8" transform="rotate(-14 22 15)" stroke="#2347e0" strokeWidth="1.8" />
                  <circle cx="17" cy="8" r="4" fill="#c9a15a" />
                </svg>
                <h3 className="mt-6 font-display text-[1.45rem] leading-snug text-ink">{s.title}</h3>
                <p className="mt-2 flex-1 leading-relaxed text-muted">{s.lead}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue">
                  Read more <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
