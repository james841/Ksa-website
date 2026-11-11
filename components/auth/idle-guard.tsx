"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/*
 * Signs someone out after a stretch of doing nothing, with a warning first.
 *
 * The server is what actually ends the session (see lib/auth/session.ts); this is
 * the courtesy on top: a minute's notice, a button to stay, and a clean trip to
 * the login page instead of a form that fails when they come back to it.
 *
 * "Doing nothing" means no mouse, keyboard, scroll or touch. Moving the mouse is
 * enough to keep a session alive, which matches what the server counts too: any
 * request from the page marks the session as used.
 */
const WARN_BEFORE_MS = 60_000;
const PING_EVERY_MS = 4 * 60_000;

export function IdleGuard({ minutes }: { minutes: number }) {
  const router = useRouter();
  const idleMs = Math.max(2, minutes) * 60_000;
  // Both are set the moment the guard mounts, never while rendering.
  const lastActive = useRef(0);
  const lastPing = useRef(0);
  const [left, setLeft] = useState<number | null>(null);
  // Kept in a ref as well, so the activity listener can read the current value
  // without being torn down and rebuilt every second.
  const leftRef = useRef<number | null>(null);
  useEffect(() => {
    leftRef.current = left;
  }, [left]);

  const ping = useCallback(async () => {
    lastPing.current = Date.now();
    try {
      const res = await fetch("/api/session/ping", { method: "POST", cache: "no-store" });
      if (!res.ok) router.push("/login?timeout=1");
    } catch {
      // Offline or asleep: leave it. The next real request decides.
    }
  }, [router]);

  const stay = useCallback(() => {
    lastActive.current = Date.now();
    setLeft(null);
    void ping();
  }, [ping]);

  useEffect(() => {
    lastActive.current = Date.now();
    lastPing.current = Date.now();
    const seen = () => {
      // While the warning is up, only the button counts, so a stray mousemove
      // from a bumped desk does not silently keep a session open.
      if (leftRef.current !== null) return;
      lastActive.current = Date.now();
      if (Date.now() - lastPing.current > PING_EVERY_MS) void ping();
    };
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "focus"] as const;
    for (const e of events) window.addEventListener(e, seen, { passive: true });

    const tick = setInterval(() => {
      const quiet = Date.now() - lastActive.current;
      if (quiet >= idleMs) {
        setLeft(0);
        router.push("/login?timeout=1");
        return;
      }
      setLeft(quiet >= idleMs - WARN_BEFORE_MS ? Math.ceil((idleMs - quiet) / 1000) : null);
    }, 1000);

    return () => {
      for (const e of events) window.removeEventListener(e, seen);
      clearInterval(tick);
    };
  }, [idleMs, ping, router]);

  if (left === null) return null;
  return (
    <div
      role="alertdialog"
      aria-labelledby="idle-title"
      className="fixed inset-x-4 bottom-4 z-100 mx-auto max-w-md rounded-[1.2rem] bg-ink p-5 text-white shadow-lift sm:inset-x-auto sm:right-6"
    >
      <p id="idle-title" className="font-display text-lg">
        Still there?
      </p>
      <p className="mt-1.5 text-sm text-white/75">
        You will be signed out in {left} second{left === 1 ? "" : "s"} because nothing has happened for a while. This keeps your
        account safe on a shared computer.
      </p>
      <button type="button" onClick={stay} className="btn btn-sm mt-4 bg-white text-ink hover:bg-sky">
        Stay signed in
      </button>
    </div>
  );
}
