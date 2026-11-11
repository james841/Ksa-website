"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/*
 * Tells the website's own counter which page is being read.
 *
 * It runs on every page change, not only the first load, because this is a
 * single-page app once it starts: moving from Home to Courses never asks the
 * server for a fresh document, so nothing would be counted without this.
 *
 * It sends a second, smaller message when the page is left, carrying how long it
 * was open. That one goes by sendBeacon, which the browser promises to deliver
 * even as the tab closes.
 */
export function Tracker() {
  const pathname = usePathname();
  const params = useSearchParams();
  const viewId = useRef<string | null>(null);
  // Set when the effect runs, not while rendering.
  const openedAt = useRef(0);

  useEffect(() => {
    // The first page of the visit has the real referrer; later ones would report
    // our own page, which is noise, so only the first is passed on.
    const referrer = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : "";
    const utm = {
      source: params.get("utm_source") ?? undefined,
      medium: params.get("utm_medium") ?? undefined,
      campaign: params.get("utm_campaign") ?? undefined,
    };
    const path = pathname + (params.toString() ? `?${params.toString()}` : "");

    let cancelled = false;
    openedAt.current = Date.now();
    viewId.current = null;

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, title: document.title, referrer, utm }),
      keepalive: true,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { id?: string } | null) => {
        if (!cancelled && d?.id) viewId.current = d.id;
      })
      .catch(() => {});

    const close = () => {
      if (!viewId.current) return;
      const seconds = Math.round((Date.now() - openedAt.current) / 1000);
      if (seconds < 1) return;
      navigator.sendBeacon?.("/api/track", new Blob([JSON.stringify({ id: viewId.current, seconds })], { type: "application/json" }));
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") close();
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      cancelled = true;
      close();
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [pathname, params]);

  return null;
}
