import type { Metadata } from "next";
import { Suspense } from "react";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin, STAFF_IDLE_MINUTES } from "@/lib/auth/session";
import { IdleGuard } from "@/components/auth/idle-guard";
import { adminThemeBoot } from "@/components/admin/theme-toggle";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ToastProvider } from "@/components/admin/toast";
import { FlashToast } from "@/components/admin/flash";
import { can } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | KSA Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ToastProvider>
      {/* Sets the saved theme before anything is painted, so the admin never
          flashes white on the way into dark mode. Only admin pages carry it. */}
      <script dangerouslySetInnerHTML={{ __html: adminThemeBoot }} />
      <div className="admin-shell min-h-dvh bg-mist lg:flex">
        <Suspense fallback={<div className="hidden w-[264px] shrink-0 bg-ink lg:block" />}>
          <Shell />
        </Suspense>
        <main id="main" className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            <Suspense fallback={<Loading />}>
              <Gate>{children}</Gate>
            </Suspense>
          </div>
        </main>
        <Suspense fallback={null}>
          <FlashToast />
        </Suspense>
      </div>
    </ToastProvider>
  );
}

async function Shell() {
  const admin = await requireAdmin();
  const [{ n }] = await db.select({ n: count() }).from(schema.quoteRequests).where(eq(schema.quoteRequests.status, "new"));
  return <AdminSidebar name={admin.name} email={admin.email} newQuotes={can(admin.staffRole, "quotes") ? n : 0} staffRole={admin.staffRole} />;
}

/** Every admin page is checked on the server. Hiding links is never the protection. */
async function Gate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      {/* Admin screens get the shorter idle window: a back office left open is
          the thing worth protecting. The server enforces it either way. */}
      <IdleGuard minutes={STAFF_IDLE_MINUTES} />
      {children}
    </>
  );
}

function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-[1.25rem] bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-[1.25rem] bg-white" />
    </div>
  );
}
