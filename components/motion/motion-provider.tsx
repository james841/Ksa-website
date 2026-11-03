"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import { useLite } from "@/lib/lite";

// Animation features load after the page is interactive, keeping the first load small.
const loadFeatures = () => import("./features").then((m) => m.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Data saver also turns off movement: less work for slow, cheap phones.
  const lite = useLite(false);
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={lite ? "always" : "user"} transition={{ type: "spring", stiffness: 140, damping: 22, mass: 0.9 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
