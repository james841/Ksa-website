"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./toast";

/*
 * Some actions finish on a different page (creating a course, deleting a quote).
 * Those pages are opened with a short flag in the web address, for example
 * ?created=1. This reads the flag, shows the pop-up once, then cleans the
 * address so a refresh does not show it again.
 */
const MESSAGES: Record<string, { title: string; description?: string; tone?: "success" | "error" | "info" }> = {
  created: { title: "Created", description: "It is saved. Add the rest of the details below." },
  saved: { title: "Saved", description: "Your changes are live on the website." },
  deleted: { title: "Deleted", description: "That item has been removed." },
  sent: { title: "Sent", description: "Your email is on its way." },
  joined: { title: "Welcome to the team", description: "You now have access to this console." },
  denied: { title: "No access to that page", description: "Your role does not include it. Ask a super admin if you need it.", tone: "info" },
};

export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const shown = useRef("");

  useEffect(() => {
    const key = Object.keys(MESSAGES).find((k) => params.get(k) === "1");
    if (!key) return;
    const stamp = `${path}?${key}`;
    if (shown.current === stamp) return;
    shown.current = stamp;
    const m = MESSAGES[key];
    toast.toast(m.title, { tone: m.tone ?? "success", description: m.description });
    const rest = new URLSearchParams(params);
    rest.delete(key);
    const q = rest.toString();
    router.replace(q ? `${path}?${q}` : path, { scroll: false });
  }, [params, path, router, toast]);

  return null;
}
