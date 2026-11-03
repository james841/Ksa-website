import { services } from "@/lib/content";

export function ServiceMarquee() {
  const names = [...services.map((s) => s.title), "NVivo Training", "Doctoral Mentorship", "Writing Retreats"];
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden}>
      {names.map((n) => (
        <li key={n} className="flex items-center whitespace-nowrap">
          <span className="px-7 font-display text-xl text-white sm:text-2xl">{n}</span>
          <svg width="34" height="18" viewBox="0 0 34 18" fill="none" aria-hidden className="shrink-0">
            <ellipse cx="17" cy="9" rx="15" ry="6" transform="rotate(-12 17 9)" stroke="white" strokeOpacity=".5" strokeWidth="1.4" />
            <circle cx="22" cy="5" r="3" fill="#c9a15a" />
          </svg>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Our services" className="group overflow-hidden bg-ink py-5">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
