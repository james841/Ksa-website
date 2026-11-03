"use client";

import { setLite, useLite } from "@/lib/lite";
import { cn } from "@/lib/utils";

/** On/off switch for data saver. Remembered on this device. */
export function DataSaverToggle({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const on = useLite(false);
  return (
    <button
      suppressHydrationWarning
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setLite(!on)}
      className={cn("inline-flex items-center gap-2.5 text-sm font-medium", tone === "dark" ? "text-white/80 hover:text-white" : "text-ink hover:text-blue", className)}
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          on ? "bg-blue" : tone === "dark" ? "bg-white/25" : "bg-line",
        )}
      >
        <span className={cn("absolute size-4 rounded-full bg-white transition-transform", on ? "translate-x-[18px]" : "translate-x-0.5")} />
      </span>
      Data saver {on ? "on" : "off"}
    </button>
  );
}
