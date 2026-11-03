"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/*
 * Small pop-up confirmations for the admin console.
 *
 * Every save, upload, delete and invite ends with one of these in the corner:
 * a tick that draws itself, the message, and a thin bar that counts down.
 * They stack, they can be closed by hand, and they pause while the pointer
 * is over them. Screen readers hear them through the live region below.
 */

export type ToastTone = "success" | "error" | "info";
type Toast = { id: number; tone: ToastTone; title: string; description?: string };

type ToastApi = {
  toast: (title: string, opts?: { tone?: ToastTone; description?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);
const LIFETIME = 5000;

/** Safe to call anywhere: outside the provider it simply does nothing. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  const fallback = useMemo<ToastApi>(() => ({ toast: () => {}, success: () => {}, error: () => {} }), []);
  return ctx ?? fallback;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const next = useRef(1);

  const remove = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const api = useMemo<ToastApi>(() => {
    const toast: ToastApi["toast"] = (title, opts) => {
      const item: Toast = { id: next.current++, tone: opts?.tone ?? "success", title, description: opts?.description };
      // Never more than three on screen at once.
      setItems((list) => [...list.slice(-2), item]);
    };
    return {
      toast,
      success: (title, description) => toast(title, { tone: "success", description }),
      error: (title, description) => toast(title, { tone: "error", description }),
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2.5 px-4 pb-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end sm:px-0 sm:pb-0"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const tones: Record<ToastTone, { bar: string; ring: string; icon: string; stroke: string }> = {
  success: { bar: "bg-success", ring: "bg-[#e8f5ee]", icon: "text-success", stroke: "#127a4a" },
  error: { bar: "bg-danger", ring: "bg-[#fbeceb]", icon: "text-danger", stroke: "#c0362c" },
  info: { bar: "bg-blue", ring: "bg-blue-50", icon: "text-blue", stroke: "#2347e0" },
};

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const tone = tones[toast.tone];

  // Auto-close, with the clock stopped while the pointer rests on the card.
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(onClose, LIFETIME);
    return () => clearTimeout(t);
  }, [paused, onClose]);

  return (
    <m.div
      layout
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, x: 24 }}
      transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.7 }}
      className="pointer-events-auto relative w-full max-w-[26rem] overflow-hidden rounded-[1.1rem] bg-white shadow-[0_18px_40px_-16px_rgba(11,20,51,.45)] ring-1 ring-line sm:w-[22rem]"
    >
      <div className="flex items-start gap-3 p-4 pr-11">
        <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-full", tone.ring, tone.icon)}>
          <Mark tone={toast.tone} stroke={tone.stroke} reduce={!!reduce} />
        </span>
        <span className="min-w-0 flex-1 pt-1">
          <span className="block font-display text-[0.95rem] font-semibold leading-snug text-ink">{toast.title}</span>
          {toast.description ? <span className="mt-0.5 block text-sm leading-snug text-muted">{toast.description}</span> : null}
        </span>
      </div>
      <button
        suppressHydrationWarning
        type="button"
        onClick={onClose}
        aria-label="Close this message"
        className="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-mist hover:text-ink"
      >
        <X size={16} />
      </button>
      {/* Countdown bar: it shows how long the message stays, and stops on hover. */}
      <m.span
        aria-hidden
        className={cn("absolute inset-x-0 bottom-0 h-[3px] origin-left", tone.bar)}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: paused || reduce ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : LIFETIME / 1000, ease: "linear" }}
      />
    </m.div>
  );
}

/** The tick (or cross) draws itself in, which reads as "it went through". */
function Mark({ tone, stroke, reduce }: { tone: ToastTone; stroke: string; reduce: boolean }) {
  const path = tone === "success" ? "M5 12.5 9.8 17.3 19 8" : tone === "error" ? "M7 7l10 10M17 7 7 17" : "M12 8h.01M12 11v6";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <m.circle
        cx="12"
        cy="12"
        r="10.5"
        stroke={stroke}
        strokeOpacity="0.25"
        strokeWidth="1.5"
        initial={reduce ? false : { pathLength: 0, rotate: -90 }}
        animate={{ pathLength: 1, rotate: -90 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "12px 12px" }}
      />
      <m.path
        d={path}
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: reduce ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
