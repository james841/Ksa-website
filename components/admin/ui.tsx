import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight } from "@/components/ui/icons";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
            <ArrowLeft size={16} /> {back.label}
          </Link>
        ) : null}
        <h1 className="text-[1.9rem] leading-tight text-ink sm:text-[2.2rem]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[0.95rem] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({ title, description, actions, children, className, pad = true }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn("rounded-[1.25rem] border border-line bg-white shadow-[0_1px_0_rgba(11,20,51,.03)]", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            {title ? <h2 className="font-sans text-base font-semibold tracking-normal text-ink">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={pad ? "p-5 sm:p-6" : undefined}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, href, tone = "white" }: { label: string; value: ReactNode; hint?: ReactNode; href?: string; tone?: "white" | "blue" | "ink" | "mist" }) {
  const tones = {
    white: "bg-white border border-line text-ink",
    blue: "bg-blue text-white",
    ink: "bg-ink text-white",
    mist: "bg-mist border border-mist-200 text-ink",
  };
  const body = (
    <>
      <p className={cn("text-sm font-medium", tone === "white" || tone === "mist" ? "text-muted" : "text-white/75")}>{label}</p>
      <p className="mt-2 font-display text-[2.4rem] leading-none tracking-tight">{value}</p>
      {hint ? <p className={cn("mt-3 text-xs", tone === "white" || tone === "mist" ? "text-muted" : "text-white/70")}>{hint}</p> : null}
      {href ? <ChevronRight size={18} className="absolute right-5 top-5 opacity-50 transition-transform group-hover:translate-x-0.5" /> : null}
    </>
  );
  const cls = cn("group relative block rounded-[1.25rem] p-5", tones[tone]);
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const badgeTones: Record<string, string> = {
  new: "bg-blue text-white",
  in_progress: "bg-[#fff3d6] text-[#7a5300]",
  responded: "bg-[#e8f5ee] text-success",
  closed: "bg-[#eceef3] text-muted",
  draft: "bg-[#eceef3] text-muted",
  published: "bg-[#e8f5ee] text-success",
  coming_soon: "bg-blue-50 text-blue",
  archived: "bg-[#eceef3] text-muted",
  cancelled: "bg-[#fbeceb] text-danger",
  scheduled: "bg-blue-50 text-blue",
  sending: "bg-[#fff3d6] text-[#7a5300]",
  sent: "bg-[#e8f5ee] text-success",
  delivered: "bg-[#e8f5ee] text-success",
  failed: "bg-[#fbeceb] text-danger",
  bounced: "bg-[#fbeceb] text-danger",
  complained: "bg-[#fbeceb] text-danger",
  queued: "bg-[#eceef3] text-muted",
  active: "bg-[#e8f5ee] text-success",
  suspended: "bg-[#fbeceb] text-danger",
  subscribed: "bg-[#e8f5ee] text-success",
  unsubscribed: "bg-[#eceef3] text-muted",
  admin: "bg-ink text-white",
  user: "bg-mist text-ink",
  open: "bg-[#e8f5ee] text-success",
  invite: "bg-mist text-ink",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize", badgeTones[value] ?? "bg-mist text-ink")}>
      {label ?? value.replace(/_/g, " ")}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-line bg-mist px-6 py-14 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      {text ? <p className="mx-auto mt-2 max-w-md text-sm text-muted">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Table shell: horizontal scroll on phones, sticky-looking header. */
export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
            {head.map((h, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold first:pl-6 last:pr-6">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line [&_td]:px-5 [&_td]:py-3.5 [&_td:first-child]:pl-6 [&_td:last-child]:pr-6">{children}</tbody>
      </table>
    </div>
  );
}

export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-6 py-4 text-sm">
      <span className="text-muted">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link className="btn btn-ghost btn-sm" href={href(page - 1)}>
            Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link className="btn btn-ghost btn-sm" href={href(page + 1)}>
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export function DefinitionList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</dt>
          <dd className="mt-1 break-words text-[0.95rem] text-ink">{v || <span className="text-muted">Not given</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A GET search/filter bar. Works without JavaScript. */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <form method="get" className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:px-6">
      {children}
    </form>
  );
}
