import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CtaBand } from "@/components/home/faq-cta";
import { AdvisoryBoard } from "@/components/about/advisory-board";
import { Milestones, Pillars, PracticalSupport, Residency, StatsBand } from "@/components/about/story";
import { Journey } from "@/components/home/journey";
import { Seal } from "@/components/ui/seal";
import { companyIntro, whyChooseUs } from "@/lib/content";
import { getBoard } from "@/lib/data/public";
import editing from "@/public/images/services/editing-blue.webp";
import topic from "@/public/images/services/topic-blue.webp";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Since our first seminars in August 2018, Knowledge Space Academy has supported researchers through institutional writing programmes, doctoral mentoring, practical training and free webinars.",
  alternates: { canonical: "/about" },
  openGraph: { url: "/about" },
};

export default async function AboutPage() {
  const board = await getBoard();
  return (
    <>
      <PageHero
        crumbs={[{ name: "About us", path: "/about" }]}
        kicker="About Knowledge Space Academy"
        title="Research support. Focused writing. Practical progress."
        lead={companyIntro}
      />

      <Pillars tone="white" />
      <StatsBand />

      <section className="bg-white py-20 sm:py-24">
        <div className="container-x grid items-start gap-14 lg:grid-cols-12">
          <div className="space-y-6 text-lg leading-relaxed text-ink/85 lg:col-span-7">
            <Reveal>
              <p>
                At Knowledge Space Academy, we provide customised research support tailored to your unique academic needs. We
                are an academic research and writing consultancy, offering expert guidance at every stage of the research
                journey. From topic selection and research design to data analysis and full manuscript development, our services
                are designed to deliver clarity, quality and results.
              </p>
            </Reveal>
            <Reveal>
              <p>
                We work with scholars, researchers and authors towards their academic and professional goals, driven by a
                core mission: to help them overcome the barriers that stand between a piece of research and its completion.
                We take you to the finish line.
              </p>
            </Reveal>
            <Reveal>
              <p>
                At the heart of our success is a multidisciplinary team of highly qualified academic specialists and seasoned
                authors. Every project we undertake is handled with precision, integrity and commitment to the highest academic
                standards.
              </p>
            </Reveal>
            <Reveal>
              <p>
                Whether you need assistance with a research project, journal manuscript, thesis or doctoral study, Knowledge Space
                Academy is your trusted partner. Our in-house team of academic reviewers, editors and proofreaders supports both
                broad subject areas and highly specialised topics.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="relative lg:col-span-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative mt-10 aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                <Image src={topic} alt="Index cards with possible research topics, one circled as researchable" fill sizes="(max-width:1024px) 45vw, 240px" className="object-cover" />
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                <Image src={editing} alt="A thesis page with editing marks and reviewer comments" fill sizes="(max-width:1024px) 45vw, 240px" className="object-cover" />
              </div>
            </div>
            <Seal className="absolute -bottom-8 left-1/2 size-28 -translate-x-1/2" />
          </Reveal>
        </div>
      </section>

      <Residency />
      <PracticalSupport />

      <section id="why" className="paper-grain scroll-mt-28 bg-mist py-20 sm:py-24">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="kicker">Why choose us</p>
            <h2 className="mt-4 text-[clamp(2rem,4.4vw,3.1rem)] leading-[1.1] text-ink">
              Personalised support that helps you succeed faster
            </h2>
          </Reveal>
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyChooseUs.map((w, i) => (
              <RevealItem
                key={w.title}
                className="group flex h-full flex-col rounded-[1.4rem] bg-white p-7 shadow-soft ring-1 ring-line transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="font-display text-sm font-semibold tracking-[0.18em] text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span aria-hidden className="mt-4 block h-[2px] w-10 bg-blue transition-[width] duration-300 group-hover:w-16" />
                <h3 className="mt-6 font-display text-xl leading-snug text-ink">{w.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{w.text}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <Milestones />
      <Journey />
      <AdvisoryBoard board={board} tone="white" />
      <div className="pt-20 sm:pt-24">
        <CtaBand />
      </div>
    </>
  );
}
