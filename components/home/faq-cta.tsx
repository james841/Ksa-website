import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { FaqList } from "@/components/ui/faq-list";
import { ArrowRight, Check } from "@/components/ui/icons";

export function HomeFaq({ faqs }: { faqs: Array<{ id: string; question: string; answer: string }> }) {
  if (!faqs.length) return null;
  return (
    <section aria-labelledby="faq-title" className="bg-white section">
      <div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-4">
          <p className="kicker">Questions</p>
          <h2 id="faq-title" className="mt-4 section-title">
            Before you get started
          </h2>
          <p className="mt-5 text-muted">Answers to what postgraduate students and researchers ask us most.</p>
          <Link href="/faqs" className="btn btn-ghost group mt-7">
            All FAQs <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <Reveal delay={0.08} className="lg:col-span-8">
          <FaqList faqs={faqs} />
        </Reveal>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="bg-white pb-20 sm:pb-24">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-blue px-6 py-14 text-white sm:px-12 sm:py-16 lg:px-16 lg:py-20">
            <svg aria-hidden viewBox="0 0 800 300" className="absolute -right-24 -top-10 w-[760px] opacity-25" fill="none">
              <ellipse cx="400" cy="150" rx="380" ry="110" transform="rotate(-10 400 150)" stroke="white" strokeWidth="2" />
              <circle cx="640" cy="60" r="14" fill="#c9a15a" />
            </svg>
            <div className="relative grid items-end gap-10 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <h2 id="cta-title" className="section-title text-white">
                  Do you have an upcoming research deadline?
                </h2>
                <p className="mt-5 max-w-xl text-lg text-white/80">
                  Schedule a consultation today. Tell us where you are in your research and we will plan the support you need.
                </p>
                <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold">
                  {["Experienced team", "Affordable pricing", "Zero plagiarism policy"].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-md bg-white/15">
                        <Check size={14} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:flex-col lg:items-end">
                <Link href="/request-a-service" className="btn btn-light group px-7 py-3.5 text-base">
                  Request a service <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/contact" className="btn px-7 py-3.5 text-base text-white ring-1 ring-white/40 hover:bg-white/10">
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
