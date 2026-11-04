"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/layout/logo";
import { Book, Chart, Globe, Help, Home, Image, Inbox, Layers, Lock, Logout, Menu, Send, Settings, Users, Video, X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { can, ROLE_INFO, sectionForPath, type StaffRole } from "@/lib/auth/permissions";

const groups = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", Icon: Home, exact: true }],
  },
  {
    label: "People",
    items: [
      { href: "/admin/quotes", label: "Service requests", Icon: Inbox, badge: "quotes" as const },
      { href: "/admin/users", label: "Users", Icon: Users },
      { href: "/admin/subscribers", label: "Subscribers", Icon: Send },
    ],
  },
  {
    label: "Learning",
    items: [
      { href: "/admin/webinars", label: "Webinars", Icon: Video },
      { href: "/admin/courses", label: "Courses", Icon: Book },
    ],
  },
  {
    label: "Marketing",
    items: [{ href: "/admin/campaigns", label: "Email campaigns", Icon: Chart }],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/content", label: "Site settings", Icon: Settings, exact: true },
      { href: "/admin/content/slides", label: "Homepage carousel", Icon: Image },
      { href: "/admin/content/faqs", label: "FAQs", Icon: Help },
      { href: "/admin/content/board", label: "Advisory board", Icon: Layers },
    ],
  },
  {
    label: "Team",
    items: [
      { href: "/admin/team", label: "Team and access", Icon: Lock },
      { href: "/admin/activity", label: "Activity log", Icon: Globe },
    ],
  },
];

export function AdminSidebar({ name, email, newQuotes, staffRole }: { name: string; email: string; newQuotes: number; staffRole: StaffRole }) {
  const path = usePathname();
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;

  const nav = (
    <nav aria-label="Admin" className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
      {groups
        .map((g) => ({ ...g, items: g.items.filter((i) => can(staffRole, sectionForPath(i.href))) }))
        .filter((g) => g.items.length > 0)
        .map((g) => (
        <div key={g.label}>
          <p className="px-3 pb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/40">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, Icon, ...rest }) => {
              const on = "exact" in rest && rest.exact ? path === href : path === href || path.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      on ? "bg-white text-ink" : "text-white/75 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{label}</span>
                    {"badge" in rest && newQuotes > 0 ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-[0.7rem] font-bold", on ? "bg-blue text-white" : "bg-blue text-white")}>{newQuotes}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-4">
      <p className="truncate text-sm font-semibold text-white">{name}</p>
      <p className="truncate text-xs text-white/50">{email}</p>
      <p className="mt-1.5 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-white/80">{ROLE_INFO[staffRole].label}</p>
      <div className="mt-3 flex gap-2">
        <Link href="/" className="btn btn-sm flex-1 bg-white/10 text-white hover:bg-white/20">
          View site
        </Link>
        <form action={logout}>
          <button suppressHydrationWarning type="submit" className="btn btn-sm bg-white/10 text-white hover:bg-white/20" aria-label="Log out">
            <Logout size={16} />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Phone / tablet top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-ink px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2 text-white">
          <Logo tone="light" className="h-8 w-auto" priority />
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider">Admin</span>
        </div>
        <button suppressHydrationWarning type="button" onClick={() => setOpenOn(open ? null : path)} className="rounded-lg p-2 text-white" aria-expanded={open} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-30 flex flex-col bg-ink pt-16 lg:hidden">
          {nav}
          {footer}
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col bg-ink lg:flex">
        <div className="flex items-center gap-2 px-6 pb-2 pt-6">
          <Logo tone="light" className="h-9 w-auto" priority />
        </div>
        <p className="px-6 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold">Admin console</p>
        {nav}
        {footer}
      </aside>
    </>
  );
}
