"use client";

import { useSyncExternalStore } from "react";

/*
 * Light or dark, for the admin only.
 *
 * The choice is kept in this browser (localStorage), and applied by a tiny script
 * that runs before the page is painted, so there is no white flash on the way in.
 * This button only has to agree with that script afterwards.
 */
export const ADMIN_THEME_KEY = "ksa-admin-theme";

/** Runs before paint, from the admin layout's <head>. Keep it small and defensive. */
export const adminThemeBoot = `(function(){try{var t=localStorage.getItem("${ADMIN_THEME_KEY}");if(!t){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-admin-theme",t)}catch(e){}})()`;

/*
 * The attribute on <html> is the one source of truth, and it is set by the boot
 * script before React exists. Reading it as external state keeps the button in
 * step with it without a second copy that could disagree.
 */
const themeStore = {
  subscribe(onChange: () => void) {
    const obs = new MutationObserver(onChange);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-admin-theme"] });
    return () => obs.disconnect();
  },
  get: () => document.documentElement.getAttribute("data-admin-theme") === "dark",
  // On the server there is no attribute yet; the boot script sorts it out first.
  server: () => false,
};

export function ThemeToggle() {
  const dark = useSyncExternalStore(themeStore.subscribe, themeStore.get, themeStore.server);

  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-admin-theme", next);
    try {
      localStorage.setItem(ADMIN_THEME_KEY, next);
    } catch {
      // Private browsing: the choice simply lasts for this visit.
    }
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-pressed={dark}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    >
      <span aria-hidden className="grid size-5 place-items-center">
        {dark ? <Sun /> : <Moon />}
      </span>
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function Moon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" {...stroke}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  );
}

function Sun() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" {...stroke}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
