/** Rotating circular seal: "Research · Insight · Impact" around the KSA orbit mark. */
export function Seal({ className = "size-28", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const fg = tone === "dark" ? "#ffffff" : "#0b1433";
  const bg = tone === "dark" ? "#0b1433" : "#ffffff";
  return (
    <div className={`relative ${className}`} aria-hidden>
      <svg viewBox="0 0 120 120" className="size-full animate-[spin_24s_linear_infinite]">
        <defs>
          <path id="seal-circle" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
        </defs>
        <circle cx="60" cy="60" r="58" fill={bg} />
        <circle cx="60" cy="60" r="56" fill="none" stroke={fg} strokeOpacity=".25" strokeDasharray="2 4" />
        <text fill={fg} fontSize="10.5" fontWeight="600" letterSpacing="3.2" fontFamily="var(--font-jakarta)">
          <textPath href="#seal-circle">RESEARCH • INSIGHT • IMPACT • KSA •</textPath>
        </text>
      </svg>
      <svg viewBox="0 0 40 24" className="absolute left-1/2 top-1/2 w-[38%] -translate-x-1/2 -translate-y-1/2" fill="none">
        <ellipse cx="20" cy="13" rx="17" ry="7" transform="rotate(-14 20 13)" stroke={fg} strokeWidth="1.8" />
        <circle cx="16" cy="7" r="3.6" fill="#c9a15a" />
      </svg>
    </div>
  );
}
