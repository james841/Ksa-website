import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { institutionalServices } from "@/lib/content";
import { ArrowRight, Check } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Research Development Services for Universities and Organisations",
  description:
    "Doctoral mentorship programmes, academic writing retreats, curated research training and NVivo workshops designed with universities, research institutions and organisations.",
  alternates: { canonical: "/institutions" },
  openGraph: { url: "/institutions" },
};

export default function InstitutionsPage() {
  return (
    <>
      <PageHero
        tone="ink"
        crumbs={[{ name: "For institutions", path: "/institutions" }]}
        kicker="For corporate organisations and institutions"
        title="Research development services shaped around your organisation"
        lead="KSA partners with universities, research institutions, corporate organisations and professional bodies to strengthen research capacity and support postgraduate development. Each engagement is shaped around your priorities, your participants' experience and the outcomes you want."
      >
        <Link href="/request-a-quote?service=Doctoral%20Mentorship%20Programmes" className="btn btn-light group mt-8">
          Discuss a programme <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </PageHero>

      <section className="bg-white">
        <nav aria-label="On this page" className="sticky top-16 z-30 border-b border-line bg-white/90 backdrop-blur">
          <ul className="container-x no-scrollbar flex gap-2 overflow-x-auto py-3">
            {institutionalServices.map((s) => (
              <li key={s.slug}>
                <a href={`#${s.slug}`} className="block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-mist">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="container-x divide-y divide-line">
          {institutionalServices.map((s) => (
            <article key={s.slug} id={s.slug} className="grid scroll-mt-36 gap-8 py-16 sm:py-20 lg:grid-cols-12">
              <Reveal className="lg:col-span-5">
                <h2 className="text-[clamp(1.9rem,3.8vw,2.8rem)] leading-[1.1] text-ink">{s.title}</h2>
                <p className="mt-4 font-display text-xl text-blue">{s.lead}</p>
              </Reveal>
              <Reveal delay={0.08} className="space-y-5 text-lg leading-relaxed text-ink/80 lg:col-span-7">
                {s.body.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
                {"list" in s && s.list ? (
                  <div className="rounded-[1.4rem] bg-mist p-7 ring-1 ring-line">
                    <p className="font-semibold text-ink">Training areas include</p>
                    <ul className="mt-4 grid gap-3 text-base sm:grid-cols-2">
                      {s.list.map((li) => (
                        <li key={li} className="flex gap-3">
                          <Check size={18} className="mt-1 shrink-0 text-blue" /> {li}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white pb-20 sm:pb-24">
        <div className="container-x">
          <Reveal>
            <div className="rounded-[2rem] bg-ink px-6 py-14 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-16">
              <div className="max-w-2xl">
                <h2 className="text-[clamp(1.9rem,4vw,3rem)] leading-[1.1]">Work with KSA</h2>
                <p className="mt-4 text-lg text-white/75">
                  Whether you are establishing a doctoral mentorship programme, planning a writing retreat, arranging targeted
                  training or reviewing an existing initiative, KSA can help shape support around your organisation&apos;s needs.
                </p>
              </div>
              <Link href="/contact" className="btn btn-light mt-8 shrink-0 lg:mt-0">
                Contact KSA to discuss your priorities
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
