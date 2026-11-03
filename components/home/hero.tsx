"use client";

import Image from "next/image";
import Link from "next/link";
import * as m from "motion/react-m";
import { ArrowRight, Video } from "@/components/ui/icons";
import { CurvedCarousel, type Slide } from "./curved-carousel";

const ease = [0.22, 1, 0.36, 1] as const;

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.85, ease, delay },
});

const audiences = ["Postgraduate students", "Academics", "Researchers", "Universities and organisations"];

/**
 * Homepage hero: a campus photo under a solid navy layer, the headline on top,
 * and the curved card row sitting across the bottom edge of the photo so the
 * two read as one scene. No gradients anywhere.
 */
export function Hero({ badge, slides, image }: { badge: string; slides: Slide[]; image: string }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-white">
      {/* Photo layer. Hidden (and never downloaded) when data saver is on: the navy colour stays. */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-ink">
        <Image
          src={image}
          alt=""
          fill
          sizes="100vw"
          quality={60}
          loading="lazy"
          className="lite-hide animate-photo object-cover object-[50%_38%]"
        />
        {/* One solid navy layer keeps every word readable on any photo. */}
        <div className="absolute inset-0 bg-ink/[0.78]" />
      </div>

      <div className="container-x pt-14 text-center sm:pt-20 lg:pt-24">
        <m.div {...rise(0.05)}>
          <Link
            href="/webinars"
            className="group inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1.5 pl-2 pr-4 font-display text-[0.82rem] font-medium text-white transition-colors hover:border-white/50 hover:bg-white/15 sm:text-sm"
          >
            <span className="grid size-6 place-items-center rounded-full bg-white/15 text-sky">
              <Video size={14} />
            </span>
            {badge}
            <ArrowRight size={15} className="text-sky transition-transform group-hover:translate-x-0.5" />
          </Link>
        </m.div>

        {/* CSS animation (not JS) so the headline paints immediately: better LCP. */}
        <h1 id="hero-title" className="animate-rise mx-auto mt-7 max-w-[62rem] text-[clamp(2.15rem,5vw,4.1rem)] font-bold leading-[1.1] tracking-[-0.035em] text-white">
          Move your research <span className="text-sky">forward</span>,
          <br className="hidden sm:block" /> from first idea to publication
        </h1>

        <p className="animate-rise mx-auto mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-white/80 sm:text-lg" style={{ animationDelay: "0.22s" }}>
          Expert guidance, practical training and personalised support for postgraduate students, academics, researchers and
          organisations, at every stage of the research journey.
        </p>

        <m.div {...rise(0.38)} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/services" className="btn btn-primary group w-full px-7 py-3.5 text-[0.95rem] sm:w-auto">
            Explore our services
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/request-a-quote" className="btn btn-light w-full px-7 py-3.5 text-[0.95rem] sm:w-auto">
            Discuss your research needs
          </Link>
        </m.div>
      </div>

      {/* The card row straddles the bottom of the photo: top half on the photo, bottom half on white. */}
      {/* --carousel-h matches the card row height in curved-carousel.tsx (phone, tablet, desktop). */}
      <div className="relative mt-10 [--carousel-h:301px] sm:mt-12 sm:[--carousel-h:397px] lg:[--carousel-h:471px]">
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 bg-white" style={{ top: "calc(var(--carousel-h, 420px) * 0.56)" }} />
        <m.div initial={{ opacity: 0, y: 70, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.2, ease, delay: 0.5 }}>
          <CurvedCarousel slides={slides} />
        </m.div>

        <m.ul
          {...rise(0.9)}
          className="container-x flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pb-14 pt-7 font-display text-[0.82rem] font-medium text-ink/70 sm:pb-16 sm:text-sm"
        >
          {/* Hairline separators instead of bullet dots: quieter, and it reads as typesetting. */}
          {audiences.map((who, i) => (
            <li key={who} className={i === 0 ? "" : "border-l border-line pl-6"}>
              {who}
            </li>
          ))}
        </m.ul>
      </div>
    </section>
  );
}
