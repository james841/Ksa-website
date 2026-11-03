import Image from "next/image";
import Link from "next/link";
import { services } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ArrowRight, ArrowUpRight } from "@/components/ui/icons";

const hatch = "repeating-linear-gradient(-45deg, rgba(255,255,255,.06) 0 2px, transparent 2px 12px)";

export function ServicesGrid() {
  return (
    <section aria-labelledby="services-title" className="relative bg-ink text-white">
      <div aria-hidden className="h-8" style={{ backgroundImage: hatch }} />
      <div className="container-x py-16 sm:py-20 lg:py-24">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="kicker text-blue-100">Research services</p>
            <h2 id="services-title" className="mt-4 max-w-2xl section-title text-white">
              Expert help with the part of your research that matters now
            </h2>
          </div>
          <Link href="/services" className="btn btn-light group shrink-0 self-start md:self-auto">
            View all services <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
          {services.map((s, i) => {
            const featured = i === 1;
            return (
              <RevealItem key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className={`group flex h-full flex-col overflow-hidden rounded-[1.4rem] p-2 transition-colors ${
                    featured ? "bg-blue" : "bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[1rem] bg-white/10">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 300px"
                      className="lite-hide object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
                    <h3 className="font-display text-xl leading-snug">{s.title}</h3>
                    <p className={`mt-2 flex-1 text-sm leading-relaxed ${featured ? "text-white/85" : "text-white/65"}`}>{s.short}</p>
                    <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${featured ? "text-white" : "text-blue-100"}`}>
                      Learn more <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
      <div aria-hidden className="h-8" style={{ backgroundImage: hatch }} />
    </section>
  );
}
