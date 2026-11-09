import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Seal } from "@/components/ui/seal";
import { ArrowRight } from "@/components/ui/icons";
import { CountUp } from "@/components/ui/count-up";
import { companyIntro, companyStats } from "@/lib/content";

/** The homepage shows four of the five figures; the About page shows them all. */
const homeStats = companyStats.filter((s) => s.small !== "Free webinars");
import chapters from "@/public/images/services/chapters-blue.webp";
import qualitative from "@/public/images/services/qualitative-blue.webp";
import proposal from "@/public/images/services/proposal-blue.webp";

export function AboutPreview() {
  return (
    <section aria-labelledby="about-title" className="bg-white section">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative order-2 lg:order-1">
          <div className="grid grid-cols-5 grid-rows-6 gap-4 sm:gap-5" style={{ aspectRatio: "1 / 1.02" }}>
            <div className="relative col-span-3 row-span-4 overflow-hidden rounded-[1.6rem] bg-blue-50">
              <Image src={chapters} alt="Thesis chapters arranged in a fan, from introduction to conclusion" fill sizes="(max-width: 1024px) 60vw, 380px" className="lite-hide object-cover" />
            </div>
            <div className="relative col-span-2 row-span-3 overflow-hidden rounded-[1.6rem] bg-blue-50">
              <Image src={qualitative} alt="An interview transcript with colour-coded qualitative themes" fill sizes="(max-width: 1024px) 40vw, 260px" className="lite-hide object-cover" />
            </div>
            <div className="relative col-span-2 row-span-3 overflow-hidden rounded-[1.6rem] bg-blue-50">
              <Image src={proposal} alt="A research proposal checklist with most items completed" fill sizes="(max-width: 1024px) 40vw, 260px" className="lite-hide object-cover" />
            </div>
            {/* The one dark block on a white page: it anchors the collage and gives the
                promise somewhere to land, instead of sitting in another pale box. */}
            <div className="col-span-3 row-span-2 flex flex-col justify-center rounded-[1.6rem] bg-ink p-5 sm:p-6">
              <p className="font-display text-[clamp(1.25rem,2.4vw,1.6rem)] leading-tight text-white">
                &ldquo;We take you to the finish line.&rdquo;
              </p>
              <span aria-hidden className="mt-4 block h-[2px] w-10 bg-sky" />
            </div>
          </div>
          <Seal className="absolute -bottom-6 left-1/2 size-24 -translate-x-1/2 drop-shadow-xl sm:size-28 lg:left-[58%]" />
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="kicker">About Knowledge Space Academy</p>
            {/* The academy's own line, in the academy's own words. */}
            <h2 id="about-title" className="mt-4 section-title">
              Research support. Focused writing. Practical progress.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">{companyIntro}</p>
          </Reveal>

          <Reveal delay={0.1}>
            {/* Boxes outlined in the brand blue, each figure counting up the first time
                it is seen. Every figure comes from the client's own record. */}
            <dl className="mt-10 grid grid-cols-2 gap-3 sm:gap-4">
              {homeStats.map((f) => (
                <div
                  key={f.small}
                  className="group rounded-[1.1rem] border border-blue/35 p-5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-blue"
                >
                  <dt className="sr-only">{f.small}</dt>
                  <dd>
                    <span aria-hidden className="block h-[3px] w-8 bg-blue transition-[width] duration-300 group-hover:w-12" />
                    <span className="mt-4 block font-display text-3xl font-bold leading-none text-blue sm:text-[2.1rem]">
                      <CountUp value={f.value} suffix={f.suffix} />
                      {f.unit ? <span className="ml-1.5 text-[0.9rem] font-semibold">{f.unit}</span> : null}
                    </span>
                    <span className="mt-2.5 block text-sm leading-snug text-muted">{f.small}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {/*
            "Why choose us" and the advisory board used to sit here. They now live
            on the About page, reached from the About menu, so this block stays
            short and the homepage does not repeat it.
          */}
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/services" className="btn btn-primary group">
                See our services <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/about" className="btn btn-ghost">
                More about us
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
