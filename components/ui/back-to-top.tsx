"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

/**
 * Appears in the bottom right once the page has been scrolled a screen or so,
 * and glides back to the top. It stays clear of the page edges on phones and
 * never covers the footer links for long, because it fades out near the top.
 */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <m.button
          suppressHydrationWarning
          key="top"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
          aria-label="Back to the top of the page"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.7 }}
          whileHover={reduce ? undefined : { y: -3 }}
          className="group fixed bottom-5 right-4 z-40 grid size-12 place-items-center rounded-full bg-ink text-white shadow-[0_16px_34px_-16px_rgba(11,20,51,.75)] ring-1 ring-white/10 transition-colors hover:bg-blue sm:bottom-7 sm:right-7 sm:size-[3.25rem]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 19V6M6 12l6-6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />
          </svg>
        </m.button>
      ) : null}
    </AnimatePresence>
  );
}
