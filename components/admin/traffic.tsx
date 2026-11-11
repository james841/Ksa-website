"use client";

import { useEffect, useState } from "react";

/*
 * The live counter, refreshed every fifteen seconds.
 *
 * It starts from numbers the server already worked out, so the panel is correct
 * the instant the page appears and never flashes a zero it has to correct.
 */
export type Live = { people: number; pages: number; top: Array<{ path: string; title: string | null; people: number }> };

export function LiveVisitors({ initial }: { initial: Live }) {
  const [live, setLive] = useState(initial);
  const [beat, setBeat] = useState(false);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      // No point counting while the tab is in the background.
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/admin/live", { cache: "no-store" });
        if (!res.ok || stop) return;
        const next = (await res.json()) as Live;
        setLive(next);
        setBeat(true);
        setTimeout(() => setBeat(false), 600);
      } catch {
        // A missed refresh is not worth telling anyone about.
      }
    };
    const t = setInterval(load, 15_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  return (
    <div className="rounded-[1.25rem] bg-ink p-5 text-white">
      <div className="flex items-center gap-2.5">
        <span className="relative flex size-2.5">
          <span className={`absolute inline-flex size-full rounded-full bg-[#4ade80] ${beat ? "animate-ping" : ""}`} />
          <span className="relative inline-flex size-2.5 rounded-full bg-[#4ade80]" />
        </span>
        <p className="text-sm font-medium text-white/75">On the site right now</p>
      </div>
      <p className="mt-3 font-display text-[2.4rem] leading-none tracking-tight">{live.people}</p>
      <p className="mt-2 text-xs text-white/70">
        {live.people === 1 ? "person" : "people"} in the last 5 minutes · {live.pages} page{live.pages === 1 ? "" : "s"} opened
      </p>
      {live.top.length ? (
        <ul className="mt-5 space-y-2 border-t border-white/15 pt-4">
          {live.top.map((p) => (
            <li key={p.path} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-white/80">{p.title ?? p.path}</span>
              <span className="shrink-0 font-semibold">{p.people}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 border-t border-white/15 pt-4 text-sm text-white/60">Nobody on the site at this moment.</p>
      )}
    </div>
  );
}

/**
 * The visits chart: plain bars, one per day, no chart library.
 * Hovering a bar names the day and the numbers.
 */
export function DailyChart({ data }: { data: Array<{ day: string; visits: number; visitors: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.visits));
  const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  return (
    <div>
      <div className="flex h-44 items-end gap-[3px]">
        {data.map((d) => (
          <div key={d.day} className="group relative flex-1" style={{ height: "100%" }}>
            <div className="flex h-full items-end">
              <div
                className="w-full rounded-t-[3px] bg-blue/25 transition-colors group-hover:bg-blue"
                style={{ height: `${Math.max(2, (d.visits / max) * 100)}%` }}
              />
            </div>
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white group-hover:block">
              {fmt(d.day)}: {d.visits} visit{d.visits === 1 ? "" : "s"}, {d.visitors} visitor{d.visitors === 1 ? "" : "s"}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{data.length ? fmt(data[0].day) : ""}</span>
        <span>{data.length ? fmt(data[data.length - 1].day) : ""}</span>
      </div>
    </div>
  );
}

/** A labelled row with a proportional bar: used for sources, devices, countries. */
export function BarRow({ label, value, total, note }: { label: string; value: number; total: number; note?: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <li className="py-2.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate font-medium text-ink">{label}</span>
        <span className="shrink-0 text-muted">
          {value} <span className="text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist">
        <div className="h-full rounded-full bg-blue" style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
    </li>
  );
}
