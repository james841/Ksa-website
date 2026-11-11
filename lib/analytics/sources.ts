/*
 * Works out where a visit came from.
 *
 * Two inputs, in order of trust:
 *   1. The campaign tags on the link (?utm_source=instagram). Put there on
 *      purpose, so they always win.
 *   2. The referring address the browser reports.
 *
 * Why both: Instagram, TikTok and Facebook open links inside their own browser,
 * which usually strips the referrer. Those visits then look like somebody typed
 * the address in. Tagging your own posted links is the only reliable fix, and
 * this file is why tagging pays off.
 */

export type Channel = "social" | "search" | "email" | "referral" | "direct" | "internal";

/** host fragment → the name to show. Longest match wins, so "l.instagram.com" works. */
const SOCIAL: Array<[string, string]> = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["fb.com", "Facebook"],
  ["fb.me", "Facebook"],
  ["linkedin", "LinkedIn"],
  ["lnkd.in", "LinkedIn"],
  ["tiktok", "TikTok"],
  ["twitter", "X (Twitter)"],
  ["t.co", "X (Twitter)"],
  ["x.com", "X (Twitter)"],
  ["youtube", "YouTube"],
  ["youtu.be", "YouTube"],
  ["whatsapp", "WhatsApp"],
  ["wa.me", "WhatsApp"],
  ["telegram", "Telegram"],
  ["t.me", "Telegram"],
  ["reddit", "Reddit"],
  ["pinterest", "Pinterest"],
  ["threads", "Threads"],
];

const SEARCH: Array<[string, string]> = [
  ["google", "Google"],
  ["bing", "Bing"],
  ["duckduckgo", "DuckDuckGo"],
  ["yahoo", "Yahoo"],
  ["ecosia", "Ecosia"],
  ["baidu", "Baidu"],
  ["yandex", "Yandex"],
  ["brave", "Brave Search"],
  ["scholar.google", "Google Scholar"],
];

const EMAIL_HINTS = ["mail.google", "outlook", "mail.yahoo", "roundcube", "zoho mail"];

function match(host: string, table: Array<[string, string]>) {
  let best: string | null = null;
  let bestLen = 0;
  for (const [needle, name] of table) {
    if (host.includes(needle) && needle.length > bestLen) {
      best = name;
      bestLen = needle.length;
    }
  }
  return best;
}

/** Pretty name for a campaign tag: "instagram" → "Instagram". */
function titleCase(v: string) {
  const known = [...SOCIAL, ...SEARCH].find(([needle]) => v.includes(needle));
  if (known) return known[1];
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export type Classified = { channel: Channel; source: string };

export function classify(opts: { referrer?: string | null; utmSource?: string | null; utmMedium?: string | null; selfHost: string }): Classified {
  const utm = opts.utmSource?.trim().toLowerCase();
  const medium = opts.utmMedium?.trim().toLowerCase() ?? "";

  if (utm) {
    const name = titleCase(utm);
    if (match(utm, SOCIAL) || medium === "social") return { channel: "social", source: name };
    if (medium.includes("email") || utm.includes("newsletter") || utm.includes("campaign")) return { channel: "email", source: name };
    if (match(utm, SEARCH) || medium.includes("cpc") || medium.includes("paid")) return { channel: "search", source: name };
    return { channel: "referral", source: name };
  }

  const ref = opts.referrer?.trim();
  if (!ref) return { channel: "direct", source: "Direct" };

  let host: string;
  try {
    host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return { channel: "direct", source: "Direct" };
  }

  // Moving between our own pages is not a new visit from anywhere.
  if (host === opts.selfHost.replace(/^www\./, "")) return { channel: "internal", source: "Internal" };

  const social = match(host, SOCIAL);
  if (social) return { channel: "social", source: social };
  const search = match(host, SEARCH);
  if (search) return { channel: "search", source: search };
  if (EMAIL_HINTS.some((h) => host.includes(h))) return { channel: "email", source: "Email" };

  return { channel: "referral", source: host };
}

/** Rough device class from the browser's own description of itself. */
export function deviceOf(userAgent: string | null): "mobile" | "tablet" | "desktop" {
  const ua = (userAgent ?? "").toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|windows phone/.test(ua)) return "mobile";
  return "desktop";
}

/** Obvious bots. Keeps the numbers honest without pretending to catch everything. */
export function looksLikeBot(userAgent: string | null) {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return true;
  return /bot|crawler|spider|crawl|slurp|facebookexternalhit|headless|lighthouse|preview|monitor|pingdom|uptime|curl|wget|python-requests|axios|node-fetch|vercel-screenshot|semrush|ahrefs|bytespider|gptbot|claudebot|ccbot/.test(
    ua,
  );
}
