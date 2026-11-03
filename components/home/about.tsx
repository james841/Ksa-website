import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Seal } from "@/components/ui/seal";
import { whyChooseUs } from "@/lib/content";
import { ArrowRight } from "@/components/ui/icons";
import chapters from "@/public/images/services/chapters-blue.webp";
import qualitative from "@/public/images/services/qualitative-blue.webp";
import proposal from "@/public/images/services/proposal-blue.webp";

const facts = [
  { big: "About a decade", small: "of research support" },
  { big: "8", small: "specialist research services" },
  { big: "All", small: "disciplines supported" },
  { big: "Free", small: "monthly research webinars" },
];

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
            <div className="col-span-3 row-span-2 flex items-center gap-4 rounded-[1.6rem] bg-mist p-5 sm:p-6">
              <p className="font-display text-[clamp(1.25rem,2.4vw,1.6rem)] leading-tight text-ink">
                &ldquo;We take you to the finish line.&rdquo;
              </p>
            </div>
          </div>
          <Seal className="absolute -bottom-6 left-1/2 size-24 -translate-x-1/2 drop-shadow-xl sm:size-28 lg:left-[58%]" />
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="kicker">About Knowledge Space Academy</p>
            <h2 id="about-title" className="mt-4 section-title">
              Research support that keeps you moving towards completion
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              We are an academic research and writing consultancy offering expert guidance at every stage of the research
              journey. From topic selection and research design to data analysis and full manuscript development, our
              multidisciplinary team of PhD-qualified specialists and seasoned authors handles every project with precision,
              integrity and care.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-line pt-8">
              {facts.map((f) => (
                <div key={f.small}>
                  <dt className="sr-only">{f.small}</dt>
                  <dd>
                    <span className="block font-display text-3xl leading-none text-ink sm:text-[2.1rem]">{f.big}</span>
                    <span className="mt-2 block text-sm text-muted">{f.small}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.15}>
            <ul className="mt-10 space-y-5">
              {whyChooseUs.map((w) => (
                <li key={w.title} className="flex gap-4">
                  <span className="mt-1.5 grid size-6 shrink-0 place-items-center rounded-full bg-blue-50">
                    <span className="size-2 rounded-full bg-blue" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{w.title}</p>
                    <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">{w.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/about" className="btn btn-dark group mt-10">
              More about us <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
