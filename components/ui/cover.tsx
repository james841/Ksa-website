import Image from "next/image";
import { cn } from "@/lib/utils";

const palettes = [
  { bg: "#2347e0", fg: "#ffffff", ring: "rgba(255,255,255,.35)" },
  { bg: "#0b1433", fg: "#ffffff", ring: "rgba(255,255,255,.28)" },
  { bg: "#eef2ff", fg: "#0b1433", ring: "rgba(35,71,224,.25)" },
  { bg: "#1a36b4", fg: "#ffffff", ring: "rgba(255,255,255,.25)" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Lightweight branded cover used when a course or webinar has no uploaded image.
 * Pure CSS and SVG, so it costs no image download at all.
 */
export function Cover({
  title,
  label,
  image,
  className,
  sizes = "400px",
  priority = false,
  hideTitle = false,
}: {
  title: string;
  label?: string;
  image?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
  hideTitle?: boolean;
}) {
  if (image) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image src={image} alt="" fill sizes={sizes} className="object-cover" priority={priority} />
      </div>
    );
  }
  const h = hash(title);
  const p = palettes[h % palettes.length];
  const tilt = -6 - (h % 14);
  const dotX = 30 + (h % 50);
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: p.bg, color: p.fg }} aria-hidden>
      <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" fill="none">
        <ellipse cx="200" cy="140" rx="230" ry="70" transform={`rotate(${tilt} 200 140)`} stroke={p.ring} strokeWidth="1.5" />
        <ellipse cx="200" cy="140" rx="170" ry="48" transform={`rotate(${tilt} 200 140)`} stroke={p.ring} strokeWidth="1" strokeDasharray="2 7" />
        <circle cx={dotX * 4} cy={60 + (h % 40)} r="9" fill="#c9a15a" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 p-4">
        {label ? <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">{label}</span> : null}
        {hideTitle ? null : <span className="line-clamp-2 block font-display text-lg leading-tight">{title.split(":")[0]}</span>}
      </div>
    </div>
  );
}
