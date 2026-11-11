import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser, IDLE_MINUTES } from "@/lib/auth/session";
import { IdleGuard } from "@/components/auth/idle-guard";
import { DashboardNav } from "@/components/dashboard/nav";

export const metadata: Metadata = { title: "My dashboard", robots: { index: false, follow: false } };

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="bg-mist">
      <div className="container-x grid gap-8 py-10 lg:grid-cols-[240px_1fr] lg:py-14">
        <aside>
          <DashboardNav />
        </aside>
        <div className="min-w-0">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.5rem] bg-white" />}>
            <Gate>{children}</Gate>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireUser("/dashboard");
  return (
    <>
      <IdleGuard minutes={IDLE_MINUTES} />
      {children}
    </>
  );
}
