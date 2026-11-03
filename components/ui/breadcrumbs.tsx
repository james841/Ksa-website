import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { ChevronRight } from "./icons";

export function Breadcrumbs({ items, tone = "dark" }: { items: Array<{ name: string; path: string }>; tone?: "dark" | "light" }) {
  const muted = tone === "light" ? "text-white/60 hover:text-white" : "text-muted hover:text-ink";
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className={muted}>Home</Link>
          </li>
          {items.map((it, i) => (
            <li key={it.path} className="flex items-center gap-1.5">
              <ChevronRight size={14} className={tone === "light" ? "text-white/40" : "text-muted/60"} />
              {i === items.length - 1 ? (
                <span aria-current="page" className={tone === "light" ? "text-white" : "text-ink"}>{it.name}</span>
              ) : (
                <Link href={it.path} className={muted}>{it.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <BreadcrumbJsonLd items={items} />
    </>
  );
}
