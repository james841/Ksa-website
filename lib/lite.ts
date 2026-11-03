"use client";

import { useSyncExternalStore } from "react";

/*
 * Data saver ("lite mode").
 *
 * On when the visitor turns it on with the Data saver switch, or, if they never
 * chose, when their browser or phone says it wants to save data (Save-Data /
 * Lite mode / a 2G connection). The choice is kept in localStorage and mirrored
 * on <html data-lite> so CSS can hide decorative images before they download.
 */

const KEY = "ksa-lite";
const EVENT = "ksa-lite-change";

type Conn = { saveData?: boolean; effectiveType?: string };

function autoDetect() {
  const c = (navigator as Navigator & { connection?: Conn }).connection;
  return Boolean(c?.saveData) || c?.effectiveType === "2g" || c?.effectiveType === "slow-2g";
}

export function readLite(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* storage blocked: fall back to the browser hint */
  }
  return autoDetect();
}

export function setLite(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  document.documentElement.toggleAttribute("data-lite", on);
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * True when data saver is on. During server rendering and hydration it reports
 * `serverValue` (default true, so heavy media is never in the first HTML).
 */
export function useLite(serverValue = true) {
  return useSyncExternalStore(subscribe, readLite, () => serverValue);
}
