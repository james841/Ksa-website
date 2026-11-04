import Link from "next/link";
import { Cover } from "@/components/ui/cover";
import { Book, Clock } from "@/components/ui/icons";

export type CourseListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  level: string;
  durationLabel: string | null;
  coverImage: string | null;
  status: string;
  lessonCount: number;
  lowData?: boolean;
  priceCents?: number;
  currency?: string;
};

const levelLabel: Record<string, string> = { all: "All levels", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export function CourseCard({ c }: { c: CourseListItem }) {
  const soon = c.status === "coming_soon";
  const [main, sub] = c.title.split(/:\s*/);
  return (
    <Link
      href={`/courses/${c.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-soft ring-1 ring-line transition-shadow hover:shadow-lift"
    >
      <div className="relative">
        <Cover title={c.title} label={c.category} image={c.coverImage} hideTitle className="aspect-[16/10]" sizes="(max-width: 640px) 90vw, 360px" />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
            soon ? "bg-white text-ink" : "bg-blue text-white"
          }`}
        >
          {soon ? "Coming soon" : "Available"}
        </span>
        {!soon && (c.priceCents ?? 0) > 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            {new Intl.NumberFormat("en-ZA", { style: "currency", currency: c.currency ?? "ZAR", maximumFractionDigits: 0 }).format((c.priceCents ?? 0) / 100)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-muted">
          <span className="rounded-md bg-mist px-2 py-0.5">{c.category}</span>
          <span className="rounded-md bg-mist px-2 py-0.5">{levelLabel[c.level] ?? c.level}</span>
          <span className="rounded-md bg-mist px-2 py-0.5">Self-paced</span>
          {c.lowData ? <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue">Low data friendly</span> : null}
        </div>
        <h3 className="mt-3 font-display text-lg leading-snug text-ink group-hover:text-blue">{main}</h3>
        {sub ? <p className="mt-1 text-sm font-medium text-ink/70">{sub}</p> : null}
        <div className="mt-2 flex-1"><p className="line-clamp-3 text-sm leading-relaxed text-muted">{c.summary}</p></div>
        <div className="mt-4 flex items-center gap-4 border-t border-line pt-4 text-xs text-muted">
          {c.lessonCount > 0 ? (
            <span className="flex items-center gap-1.5">
              <Book size={14} /> {c.lessonCount} lesson{c.lessonCount === 1 ? "" : "s"}
            </span>
          ) : null}
          {c.durationLabel ? (
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> {c.durationLabel}
            </span>
          ) : null}
          <span className="ml-auto font-semibold text-blue">{soon ? "Get notified" : "View course"}</span>
        </div>
      </div>
    </Link>
  );
}
