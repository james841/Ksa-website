"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Plus } from "./icons";
import { cn } from "@/lib/utils";

export function FaqList({ faqs }: { faqs: Array<{ id: string; question: string; answer: string }> }) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);
  return (
    <ul className="divide-y divide-line border-y border-line">
      {faqs.map((f) => {
        const isOpen = open === f.id;
        return (
          <li key={f.id}>
            <h3>
              <button suppressHydrationWarning
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-${f.id}`}
                onClick={() => setOpen(isOpen ? null : f.id)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left font-display text-lg text-ink sm:text-xl"
              >
                {f.question}
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border border-line transition-all duration-300", isOpen && "rotate-45 border-blue bg-blue text-white")}>
                  <Plus size={18} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <m.div
                  id={`faq-${f.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pb-6 pr-12 leading-relaxed text-muted">{f.answer}</p>
                </m.div>
              ) : null}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
