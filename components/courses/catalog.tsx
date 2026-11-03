"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { CourseCard, type CourseListItem } from "./course-card";
import { Search } from "@/components/ui/icons";
import { useLite } from "@/lib/lite";

export function CourseCatalog({ courses }: { courses: CourseListItem[] }) {
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [status, setStatus] = useState<"all" | "published" | "coming_soon">("all");
  const [lowOnly, setLowOnly] = useState(false);
  const lite = useLite(false);
  const lowCount = courses.filter((c) => c.lowData).length;
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    courses.forEach((c) => map.set(c.category, (map.get(c.category) ?? 0) + 1));
    return [...map.entries()];
  }, [courses]);

  const filtered = courses.filter((c) => {
    if (status !== "all" && c.status !== status) return false;
    if (cats.length && !cats.includes(c.category)) return false;
    if (lowOnly && !c.lowData) return false;
    if (q && !`${c.title} ${c.summary} ${c.category}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
        <div>
          <label htmlFor="course-search" className="field-label">Search</label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input suppressHydrationWarning id="course-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses" className="field pl-10" />
          </div>
        </div>
        <fieldset>
          <legend className="field-label">Availability</legend>
          <div className="mt-2 flex flex-wrap gap-2 lg:flex-col">
            {([
              ["all", "All courses"],
              ["published", "Available now"],
              ["coming_soon", "Coming soon"],
            ] as const).map(([v, l]) => (
              <label key={v} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                <input suppressHydrationWarning type="radio" name="status" checked={status === v} onChange={() => setStatus(v)} className="size-4 accent-blue" />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="field-label">Data use</legend>
          <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-sm text-ink">
            <input suppressHydrationWarning type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="mt-0.5 size-4 accent-blue" />
            <span>
              Low data friendly <span className="text-muted">({lowCount})</span>
              <span className="block text-xs text-muted">Every lesson works with text notes or audio, no video needed.</span>
            </span>
          </label>
          {lite && lowCount && !lowOnly ? (
            <button suppressHydrationWarning type="button" onClick={() => setLowOnly(true)} className="mt-2 text-xs font-semibold text-blue hover:underline">
              Data saver is on: show only low data courses
            </button>
          ) : null}
        </fieldset>
        <fieldset>
          <legend className="field-label">Topic</legend>
          <div className="mt-2 flex flex-wrap gap-2 lg:flex-col">
            {categories.map(([cat, n]) => (
              <label key={cat} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                <input suppressHydrationWarning
                  type="checkbox"
                  checked={cats.includes(cat)}
                  onChange={(e) => setCats((p) => (e.target.checked ? [...p, cat] : p.filter((x) => x !== cat)))}
                  className="size-4 accent-blue"
                />
                {cat} <span className="text-muted">({n})</span>
              </label>
            ))}
          </div>
        </fieldset>
        {q || cats.length || lowOnly || status !== "all" ? (
          <button suppressHydrationWarning type="button" className="text-sm font-semibold text-blue hover:underline" onClick={() => { setQ(""); setCats([]); setLowOnly(false); setStatus("all"); }}>
            Clear filters
          </button>
        ) : null}
      </aside>
      <div>
        <p className="mb-5 text-sm text-muted" aria-live="polite">
          Showing {filtered.length} of {courses.length} courses
        </p>
        {filtered.length ? (
          <m.ul layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((c) => (
                <m.li key={c.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }}>
                  <CourseCard c={c} />
                </m.li>
              ))}
            </AnimatePresence>
          </m.ul>
        ) : (
          <div className="rounded-2xl bg-mist p-10 text-center ring-1 ring-line">
            <p className="font-display text-2xl text-ink">No courses match these filters</p>
            <p className="mt-2 text-muted">Try a different search word or clear the filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
