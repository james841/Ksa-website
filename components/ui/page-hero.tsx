import type { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";
import { Reveal } from "@/components/motion/reveal";

export function PageHero({
  crumbs,
  kicker,
  title,
  lead,
  children,
  tone = "mist",
}: {
  crumbs: Array<{ name: string; path: string }>;
  kicker?: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
  tone?: "mist" | "ink";
}) {
  const dark = tone === "ink";
  return (
    <section className={`relative overflow-hidden ${dark ? "bg-ink text-white" : "bg-mist text-ink"}`}>
      <svg aria-hidden viewBox="0 0 1200 400" className="pointer-events-none absolute -right-60 -top-24 w-[1100px] max-w-none" fill="none">
        <ellipse cx="600" cy="200" rx="560" ry="150" transform="rotate(-9 600 200)" stroke={dark ? "#ffffff" : "#2347e0"} strokeOpacity={dark ? 0.12 : 0.14} strokeWidth="2" />
        <circle cx="1000" cy="72" r="11" fill="#2347e0" />
      </svg>
      <div className="container-x relative pb-16 pt-10 sm:pb-20 sm:pt-12 lg:pb-24">
        <Breadcrumbs items={crumbs} tone={dark ? "light" : "dark"} />
        <Reveal className="mt-10 max-w-3xl sm:mt-14">
          {kicker ? <p className={`kicker ${dark ? "text-blue-100" : ""}`}>{kicker}</p> : null}
          <h1 className="mt-4 text-[clamp(2.1rem,4.8vw,3.6rem)] font-bold leading-[1.12] tracking-[-0.03em]">{title}</h1>
          {lead ? <div className={`mt-6 max-w-2xl text-lg leading-relaxed ${dark ? "text-white/75" : "text-muted"}`}>{lead}</div> : null}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
