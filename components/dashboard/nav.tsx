"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { logout } from "@/app/actions/auth";
import { Book, Home, Logout, Settings, Video } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", Icon: Home },
  { href: "/dashboard/courses", label: "My courses", Icon: Book },
  { href: "/dashboard/webinars", label: "My webinars", Icon: Video },
  { href: "/dashboard/settings", label: "Account settings", Icon: Settings },
];

export function DashboardNav() {
  return (
    <nav aria-label="Dashboard" className="lg:sticky lg:top-28">
      <Suspense fallback={<List active="" />}>
        <Active />
      </Suspense>
      <form action={logout} className="mt-2 hidden lg:block">
        <button suppressHydrationWarning type="submit" className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-white hover:text-ink">
          <Logout size={18} /> Log out
        </button>
      </form>
    </nav>
  );
}

function Active() {
  return <List active={usePathname()} />;
}

function List({ active }: { active: string }) {
  return (
    <ul className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, Icon }) => {
        const on = active === href;
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn("flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-colors", on ? "bg-ink text-white" : "text-ink hover:bg-white")}
            >
              <Icon size={18} /> {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
