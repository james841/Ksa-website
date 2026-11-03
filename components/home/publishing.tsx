import Link from "next/link";
import Image from "next/image";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { initials } from "@/lib/utils";
import { ArrowRight } from "@/components/ui/icons";
import manuscript from "@/public/images/services/manuscript-blue.webp";

export function Publishing({ board }: { board: Array<{ id: string; name: string; affiliation: string; photo: string | null }> }) {
  return (
    <section aria-labelledby="pub-title" className="bg-ink text-white">
      <div className="container-x grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-2 lg:gap-20 lg:py-28">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] max-w-md overflow-hidden rounded-[1.6rem]">
            <Image src={manuscript} alt="A journal article manuscript marked as submitted" fill sizes="(max-width: 1024px) 90vw, 440px" className="lite-hide object-cover" />
          </div>
        </Reveal>
        <div>
          <Reveal>
            <p className="kicker text-blue-100">Publishing and scholarly engagement</p>
            <h2 id="pub-title" className="mt-4 section-title text-white">
              Supporting publication, dialogue and research exchange
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/70">
              KSA supports academic publication through its publishing partnership with the University of Johannesburg Press for{" "}
              <em className="not-italic font-semibold text-white">Decentre: Journal of Interdisciplinary Studies</em> (DJIS). International academic
              conferences are coming soon, bringing researchers together to present work, exchange ideas and build collaborations.
            </p>
            <Link href="/publishing" className="btn btn-light group mt-8">
              Publishing and conferences <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <div className="mt-14 border-t border-white/10 pt-10">
            <p className="font-display text-2xl">Advisory board</p>
            <RevealGroup className="mt-6 grid gap-5 sm:grid-cols-2">
              {board.map((b) => (
                <RevealItem key={b.id} className="flex items-center gap-4">
                  {b.photo ? (
                    <Image src={b.photo} alt={b.name} width={56} height={56} className="size-14 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/10 font-display text-lg text-white ring-1 ring-white/15">
                      {initials(b.name)}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-sm text-white/60">{b.affiliation}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </div>
    </section>
  );
}
