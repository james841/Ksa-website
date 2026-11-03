import Link from "next/link";
import { Cover } from "@/components/ui/cover";
import { LocalTime } from "@/components/ui/local-time";
import { Calendar, Globe } from "@/components/ui/icons";

export type WebinarListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  speakerName: string | null;
  startsAt: Date;
  coverImage: string | null;
  status: string;
};

export function WebinarRow({ w, past = false }: { w: WebinarListItem; past?: boolean }) {
  return (
    <article className="group grid grid-cols-[96px_1fr] gap-5 border-t border-line py-6 sm:grid-cols-[168px_1fr] sm:gap-7">
      <Link href={`/webinars/${w.slug}`} tabIndex={-1} aria-hidden className="block">
        <Cover title={w.title} image={w.coverImage} className="aspect-[4/3] rounded-xl transition-transform duration-500 group-hover:scale-[1.02]" sizes="170px" />
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {w.status === "cancelled" ? "Cancelled" : past ? "Past webinar" : "Live webinar"}
        </p>
        <h3 className="mt-1.5 font-display text-xl leading-snug text-ink sm:text-[1.4rem]">
          <Link href={`/webinars/${w.slug}`} className="hover:text-blue">
            {w.title}
          </Link>
        </h3>
        <p className="mt-2 hidden max-w-2xl text-[0.95rem] leading-relaxed text-muted sm:block">{w.summary}</p>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/80">
          <span className="font-semibold text-ink">{past ? "Recorded" : "Free"}</span>
          <span className="flex items-center gap-1.5">
            <Calendar size={15} /> <LocalTime iso={w.startsAt.toISOString()} />
          </span>
          <span className="flex items-center gap-1.5">
            <Globe size={15} /> Online via Zoom
          </span>
          {w.speakerName ? <span>with {w.speakerName}</span> : null}
        </p>
      </div>
    </article>
  );
}
