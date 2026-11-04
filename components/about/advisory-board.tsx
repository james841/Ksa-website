import Image from "next/image";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { initials } from "@/lib/utils";

export type BoardMember = { id: string; name: string; affiliation: string | null; photo: string | null };

/**
 * The advisory board. It used to sit on the homepage; it now lives under
 * About (and on the publishing page), reached from the About menu.
 * The same section is used in both places so the two never drift apart.
 */
export function AdvisoryBoard({
  board,
  tone = "white",
  kicker = "Governance",
  title = "Our advisory board",
  lead = "Senior researchers and academics who guide the academy's standards, ethics and direction.",
}: {
  board: BoardMember[];
  tone?: "white" | "mist";
  kicker?: string;
  title?: string;
  lead?: string;
}) {
  if (!board.length) return null;
  return (
    <section id="advisory-board" aria-labelledby="advisory-board-title" className={`${tone === "mist" ? "bg-mist" : "bg-white"} section scroll-mt-28`}>
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <p className="kicker">{kicker}</p>
          <h2 id="advisory-board-title" className="mt-4 section-title">
            {title}
          </h2>
          <p className="section-lead">{lead}</p>
        </Reveal>
        <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {board.map((b) => (
            <RevealItem
              key={b.id}
              className={`group h-full rounded-[1.4rem] ${tone === "mist" ? "bg-white" : "bg-mist"} p-7 ring-1 ring-line transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift`}
            >
              {b.photo ? (
                <Image src={b.photo} alt={b.name} width={88} height={88} className="size-20 rounded-full object-cover" />
              ) : (
                <span className="grid size-20 place-items-center rounded-full bg-ink font-display text-2xl text-white">{initials(b.name)}</span>
              )}
              <span aria-hidden className="mt-6 block h-[2px] w-10 bg-blue transition-[width] duration-300 group-hover:w-16" />
              <p className="mt-5 font-display text-xl leading-snug text-ink">{b.name}</p>
              {b.affiliation ? <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">{b.affiliation}</p> : null}
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
