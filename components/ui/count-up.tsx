"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { useLite } from "@/lib/lite";

/**
 * A number that counts up to its value the first time it scrolls into view.
 *
 * It starts at zero only when it is going to animate. When the visitor has asked
 * for less motion, or has data saver on, the real number is painted straight
 * away: a counter stuck at 0 is worse than no counter, and search engines and
 * screen readers read the final value either way (the live number is marked
 * aria-hidden and the real one is read from the label).
 */
export function CountUp({
  value,
  suffix = "",
  duration = 1600,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const lite = useLite(false);
  const still = Boolean(reduce) || lite;
  const [counted, setCounted] = useState(0);
  // Worked out while rendering, so no effect has to set state just to stand still.
  const shown = still ? value : counted;

  useEffect(() => {
    if (still || !inView) return;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      // Fast at first, easing to a stop on the exact number.
      const eased = 1 - Math.pow(1 - t, 3);
      setCounted(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, still]);

  return (
    <span ref={ref} className={className}>
      {/* The animating copy is hidden from assistive tech; the full value sits beside it. */}
      <span aria-hidden>
        {shown.toLocaleString("en-ZA")}
        {suffix}
      </span>
      <span className="sr-only">
        {value.toLocaleString("en-ZA")}
        {suffix}
      </span>
    </span>
  );
}
