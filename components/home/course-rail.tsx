"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useInView, useReducedMotion } from "motion/react";
import { Reveal } from "@/components/motion/reveal";
import { CourseCard, type CourseListItem } from "@/components/courses/course-card";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";
import { useLite } from "@/lib/lite";

/*
 * The course row on the homepage.
 *
 * It scrolls by one card at a time, with arrows, and moves on by itself every
 * five seconds. It waits while someone is reading it: pointer over it, keyboard
 * focus inside it, a finger on it, the section off screen, the browser tab in the
 * background, data saver on, or reduced motion turned on in the system settings.
 */
const EVERY = 5000;

export function CourseRail({ courses }: { courses: CourseListItem[] }) {
  const rail = useRef<HTMLUListElement>(null);
  const hold = useRef(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const reduce = useReducedMotion();
  const lite = useLite(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { margin: "0px 0px -20% 0px" });

  /** One card plus the gap between cards. */
  const step = () => {
    const el = rail.current;
    if (!el) return 0;
    const first = el.firstElementChild as HTMLElement | null;
    if (!first) return el.clientWidth;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || "20") || 20;
    return first.offsetWidth + gap;
  };

  const readEdges = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    readEdges();
    el.addEventListener("scroll", readEdges, { passive: true });
    const ro = new ResizeObserver(readEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", readEdges);
      ro.disconnect();
    };
  }, [readEdges]);

  const go = useCallback(
    (dir: 1 | -1, smooth = true) => {
      const el = rail.current;
      if (!el) return;
      const end = el.scrollWidth - el.clientWidth;
      let left = el.scrollLeft + dir * step();
      // Wrap round, so the row never gets stuck at either end.
      if (dir === 1 && el.scrollLeft >= end - 8) left = 0;
      if (dir === -1 && el.scrollLeft <= 8) left = end;
      el.scrollTo({ left, behavior: smooth && !reduce ? "smooth" : "auto" });
    },
    [reduce],
  );

  // Move on every five seconds, then wait five seconds again.
  useEffect(() => {
    if (reduce || lite || !inView) return;
    const id = setInterval(() => {
      if (hold.current || document.hidden) return;
      go(1);
    }, EVERY);
    return () => clearInterval(id);
  }, [go, reduce, lite, inView]);

  const pause = () => (hold.current = true);
  const resume = () => (hold.current = false);

  const arrow = "grid size-11 place-items-center rounded-full border border-line bg-white text-ink transition-colors hover:border-blue hover:bg-blue hover:text-white disabled:opacity-40";

  return (
    // The rail now sits in a section of its own, so it carries no top margin.
    <div ref={sectionRef}>
      <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="kicker">Self-paced online courses</p>
          <h3 className="mt-4 max-w-xl text-[1.6rem] leading-tight text-ink sm:text-[1.9rem]">
            Learn at your pace. Move your research forward.
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => {
                pause();
                go(-1);
                window.setTimeout(resume, EVERY);
              }}
              aria-label="Previous courses"
              className={arrow}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => {
                pause();
                go(1);
                window.setTimeout(resume, EVERY);
              }}
              aria-label="More courses"
              className={arrow}
            >
              <ArrowRight size={18} />
            </button>
          </div>
          <Link href="/courses" className="btn btn-ghost group">
            Browse courses <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <ul
          ref={rail}
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocusCapture={pause}
          onBlurCapture={resume}
          onPointerDown={pause}
          onPointerUp={resume}
          onTouchStart={pause}
          onTouchEnd={resume}
          className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8"
        >
          {courses.slice(0, 8).map((c) => (
            <li key={c.id} className="w-[82%] shrink-0 snap-start sm:w-[45%] lg:w-[23.5%]">
              <CourseCard c={c} />
            </li>
          ))}
        </ul>
      </Reveal>

      {/* How far along the row is, for people who are not using the arrows. */}
      <div aria-hidden className="mx-auto mt-1 h-[3px] w-full max-w-xs overflow-hidden rounded-full bg-mist-200 sm:hidden">
        <span className={`block h-full rounded-full bg-blue transition-[margin,width] duration-300 ${atStart ? "w-1/3" : atEnd ? "ml-auto w-1/3" : "mx-auto w-1/3"}`} />
      </div>
    </div>
  );
}
