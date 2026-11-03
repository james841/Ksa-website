"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  animate,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  wrap,
  type MotionValue,
} from "motion/react";
import * as m from "motion/react-m";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";
import { useLite } from "@/lib/lite";

export type Slide = { id: string; title: string; caption?: string | null; href?: string | null; image: string };

type Geometry = { cardW: number; cardH: number; step: number; radius: number; perspective: number; height: number; mask: string };

function geometryFor(width: number): Geometry {
  // Card size and curve tuned for phone, tablet and desktop.
  const cardW = width < 640 ? 138 : width < 1024 ? 180 : 214;
  const cardH = Math.round(cardW * 1.36);
  const step = width < 640 ? 0.52 : width < 1024 ? 0.42 : 0.36; // radians between cards
  const radius = (cardW * 1.1) / step;
  const perspective = width < 640 ? 640 : 900;
  const height = Math.round(cardH * (width < 640 ? 1.6 : 1.62));
  // Wider soft fade on large screens; a narrow one on phones where fewer cards fit.
  const mask =
    width < 640
      ? "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)"
      : "linear-gradient(90deg, transparent 0%, rgb(0 0 0 / 0.35) 7%, #000 20%, #000 80%, rgb(0 0 0 / 0.35) 93%, transparent 100%)";
  return { cardW, cardH, step, radius, perspective, height, mask };
}

/**
 * A concave, cylinder-style carousel: cards sit on the inside of a curve, so
 * the outer cards turn inwards and appear larger. Drift is continuous and slow;
 * it pauses on hover, focus, drag, when off-screen, and for reduced-motion users.
 */
export function CurvedCarousel({ slides }: { slides: Slide[] }) {
  // Repeat short lists so the curve is always filled.
  const items = slides.length >= 8 ? slides : Array.from({ length: Math.ceil(8 / Math.max(slides.length, 1)) }, () => slides).flat();
  const count = items.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geometry>(() => geometryFor(1280));
  const progress = useMotionValue(0);
  const paused = useRef(false);
  const dragging = useRef<{ x: number; t: number; v: number; start: number; moved: boolean } | null>(null);
  const reduce = useReducedMotion();
  const lite = useLite(false); // data saver: no drift, lighter images
  const inView = useInView(containerRef, { margin: "200px 0px" });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setGeo(geometryFor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduce || lite || paused.current || dragging.current || !inView) return;
    progress.set(progress.get() + delta * 0.00016); // about one card every 6 seconds
  });

  const pxPerCard = geo.radius * geo.step;

  const go = (dir: 1 | -1) => {
    const target = Math.round(progress.get()) + dir;
    animate(progress, target, { type: "spring", stiffness: 90, damping: 20 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = { x: e.clientX, t: performance.now(), v: 0, start: e.clientX, moved: false };
    progress.stop();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragging.current;
    if (!d) return;
    const now = performance.now();
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(e.clientX - d.start) > 6) {
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    progress.set(progress.get() - dx / pxPerCard);
    d.v = (-dx / pxPerCard) / Math.max(now - d.t, 1);
    d.x = e.clientX;
    d.t = now;
  };
  const onPointerUp = () => {
    const d = dragging.current;
    if (!d) return;
    dragging.current = null;
    if (!d.moved) return;
    const target = Math.round(progress.get() + d.v * 260);
    animate(progress, target, { type: "spring", stiffness: 70, damping: 18 });
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Research services"
      className="relative"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocusCapture={() => (paused.current = true)}
      onBlurCapture={() => (paused.current = false)}
    >
      <div
        ref={containerRef}
        className="relative w-full cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
        style={{
          height: geo.height,
          perspective: geo.perspective,
          perspectiveOrigin: "50% 50%",
          // Cards fade out at the sides so the row melts into the page instead of being cut off.
          maskImage: geo.mask,
          WebkitMaskImage: geo.mask,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          // A drag should never count as a click on a card.
          if (dragging.current?.moved) e.preventDefault();
        }}
      >
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {items.map((slide, i) => (
            <Card key={`${slide.id}-${i}`} slide={slide} index={i} count={count} progress={progress} geo={geo} lite={lite} />
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <button suppressHydrationWarning type="button" onClick={() => go(-1)} aria-label="Previous service" className="grid size-10 place-items-center rounded-full border border-line bg-white text-ink shadow-soft transition-colors hover:border-blue hover:bg-blue hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <span className="font-display text-xs font-medium uppercase tracking-[0.14em] text-muted">Drag to explore</span>
        <button suppressHydrationWarning type="button" onClick={() => go(1)} aria-label="Next service" className="grid size-10 place-items-center rounded-full border border-line bg-white text-ink shadow-soft transition-colors hover:border-blue hover:bg-blue hover:text-white">
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function Card({ slide, index, count, progress, geo, lite }: { slide: Slide; index: number; count: number; progress: MotionValue<number>; geo: Geometry; lite: boolean }) {
  const rel = useTransform(progress, (p) => wrap(-count / 2, count / 2, index - p));
  const transform = useTransform(rel, (r) => {
    const theta = r * geo.step;
    const x = geo.radius * Math.sin(theta);
    const z = geo.radius * (1 - Math.cos(theta));
    const rot = (-theta * 180) / Math.PI;
    return `translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${rot.toFixed(3)}deg)`;
  });
  const opacity = useTransform(rel, (r) => {
    const a = Math.abs(r * geo.step);
    // Fade cards out well before they turn side-on, so no hard edges show at the sides.
    return Math.max(0, Math.min(1, (1.02 - a) / 0.3));
  });
  const zIndex = useTransform(rel, (r) => Math.round(Math.abs(r) * 10));
  const visibility = useTransform(opacity, (o) => (o <= 0.01 ? "hidden" : "visible"));
  const inner = (
    <>
      <Image
        src={slide.image}
        alt={slide.title}
        fill
        draggable={false}
        sizes={lite ? "160px" : "(max-width: 640px) 220px, 340px"}
        quality={lite ? 60 : 75}
        className="pointer-events-none object-cover"
      />
      {/* Solid label panel (no fade), inset like a caption card. */}
      <span className="absolute inset-x-2 bottom-2 rounded-[1rem] bg-ink/90 px-3 py-2.5 text-left sm:inset-x-2.5 sm:bottom-2.5 sm:px-3.5 sm:py-3">
        <span className="block font-display text-[0.8rem] font-semibold leading-snug text-white sm:text-[0.95rem]">{slide.title}</span>
        <span className="mt-1 hidden items-center gap-1 font-display text-[0.7rem] font-medium uppercase tracking-[0.12em] text-sky sm:flex">
          Learn more <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </>
  );
  return (
    <m.div
      className="absolute left-1/2 top-1/2 will-change-transform"
      style={{
        width: geo.cardW,
        height: geo.cardH,
        marginLeft: -geo.cardW / 2,
        marginTop: -geo.cardH / 2,
        transform,
        opacity,
        zIndex,
        visibility,
        backfaceVisibility: "hidden",
      }}
    >
      {slide.href ? (
        <Link
          href={slide.href}
          draggable={false}
          className="group relative block size-full overflow-hidden rounded-[1.4rem] bg-ink shadow-[0_24px_40px_-20px_rgba(11,20,51,.6)] ring-1 ring-white/15"
        >
          {inner}
        </Link>
      ) : (
        <div className="relative size-full overflow-hidden rounded-[1.4rem] bg-ink">{inner}</div>
      )}
    </m.div>
  );
}
