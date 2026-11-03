"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions, timeZone?: string) =>
  new Intl.DateTimeFormat("en-GB", { ...opts, timeZone }).format(d);

/**
 * Shows a date in the visitor's own time zone. The server renders it in
 * West Africa Time first, then the browser swaps in local time.
 */
export function LocalTime({ iso, mode = "datetime" }: { iso: string; mode?: "date" | "datetime" | "time" }) {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions =
    mode === "date"
      ? { weekday: "short", day: "numeric", month: "long", year: "numeric" }
      : mode === "time"
        ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }
        : { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" };
  // Server (and first paint): West Africa Time. Browser: the visitor's own zone.
  const text = useSyncExternalStore(
    noSubscribe,
    () => fmt(d, opts),
    () => fmt(d, opts, "Africa/Lagos"),
  );
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
