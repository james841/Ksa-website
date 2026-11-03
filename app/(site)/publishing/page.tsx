import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { getBoard } from "@/lib/data/public";
import { initials } from "@/lib/utils";
import manuscript from "@/public/images/services/manuscript-blue.webp";

export const metadata: Metadata = {
  title: "Academic Publishing, Conferences and Advisory Board",
  description:
    "KSA supports scholarly publication through its partnership with the University of Johannesburg Press for Decentre: Journal of Interdisciplinary Studies, and is preparing international academic conferences.",
  alternates: { canonical: "/publishing" },
  openGraph: { url: "/publishing" },
};

export default async function PublishingPage() {
  const board = await getBoard();
  return (
    <>
      <PageHero
        crumbs={[{ name: "Publishing and conferences", path: "/publishing" }]}
        kicker="Academic publishing and scholarly engagement"
        title="Supporting scholarly publication, dialogue and research exchange"
      />
      <section className="bg-white py-20 sm:py-24">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-[clamp(1.9rem,3.8vw,2.8rem)] leading-[1.1] text-ink">A publishing partnership with the University of Johannesburg Press</h2>
            <p className="mt-6 text-lg leading-relaxed text-ink/80">
              KSA supports academic publication through its publishing partnership with the University of Johannesburg Press for{" "}
              <em className="not-italic font-semibold">Decentre: Journal of Interdisciplinary Studies</em> (DJIS). This partnership reflects our commitment to
              advancing interdisciplinary scholarship and providing opportunities for research to contribute to wider academic
              conversations.
            </p>
            <Link href="/services/journal-manuscript-support" className="btn btn-dark mt-8">
              Get journal manuscript support
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-[1.8rem] shadow-lift">
              <Image src={manuscript} alt="A journal article manuscript stamped as submitted" fill sizes="(max-width:1024px) 90vw, 448px" className="lite-hide object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink py-20 text-white sm:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-blue-100">Coming soon</p>
            <h2 className="mt-5 text-[clamp(1.9rem,3.8vw,2.8rem)] leading-[1.1]">International academic conferences</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/75">
              As part of our expanding scholarly engagement activities, KSA is preparing to organise international academic
              conferences that bring together researchers, academics, postgraduate students and practitioners across disciplines.
              These conferences will provide opportunities to present research, exchange ideas, receive constructive feedback and
              explore collaborations across institutions and countries. Conference themes, dates and participation details will be
              announced as they become available.
            </p>
            <p className="mt-5 leading-relaxed text-white/60">
              Together with our research training, mentorship and writing programmes, these publishing and conference initiatives
              extend KSA&apos;s support across the research journey, from developing ideas to sharing findings and building scholarly
              connections.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="rounded-[1.5rem] bg-white/5 p-7 ring-1 ring-white/10">
              <p className="font-display text-2xl">Be the first to hear</p>
              <p className="mt-2 text-sm text-white/70">Get the call for papers and registration dates by email.</p>
              <div className="mt-5">
                <NewsletterForm source="conferences" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24" aria-labelledby="board-title">
        <div className="container-x">
          <Reveal>
            <p className="kicker">Governance</p>
            <h2 id="board-title" className="mt-4 text-[clamp(1.9rem,3.8vw,2.8rem)] leading-[1.1] text-ink">
              Knowledge Space Academy Advisory Board
            </h2>
          </Reveal>
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {board.map((b) => (
              <RevealItem key={b.id} className="rounded-[1.4rem] bg-mist p-7 ring-1 ring-line">
                {b.photo ? (
                  <Image src={b.photo} alt={b.name} width={88} height={88} className="size-22 rounded-full object-cover" />
                ) : (
                  <span className="grid size-20 place-items-center rounded-full bg-ink font-display text-2xl text-white">{initials(b.name)}</span>
                )}
                <p className="mt-6 font-display text-xl text-ink">{b.name}</p>
                <p className="mt-1 text-muted">{b.affiliation}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  );
}
