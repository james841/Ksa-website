/**
 * Admin forms use <input type="datetime-local">, which has no time zone.
 * We read and show those values in the academy's time zone (default: Lagos, WAT)
 * and store real UTC timestamps in the database. Change NEXT_PUBLIC_ADMIN_TIMEZONE
 * in .env if the team works from another zone.
 */
export const ADMIN_TZ = process.env.NEXT_PUBLIC_ADMIN_TIMEZONE || "Africa/Lagos";

function offsetMs(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - date.getTime();
}

/** "2026-11-05T14:00" (in the admin time zone) -> Date, or null when empty/invalid. */
export function localInputToDate(value: string | null | undefined, tz = ADMIN_TZ): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let result = guess - offsetMs(new Date(guess), tz);
  const second = offsetMs(new Date(result), tz);
  if (guess - second !== result) result = guess - second;
  return new Date(result);
}

/** Date -> "2026-11-05T14:00" in the admin time zone, for defaultValue on inputs. */
export function dateToLocalInput(d: Date | string | null | undefined, tz = ADMIN_TZ) {
  if (!d) return "";
  const date = new Date(d);
  const shifted = new Date(date.getTime() + offsetMs(date, tz));
  return shifted.toISOString().slice(0, 16);
}
