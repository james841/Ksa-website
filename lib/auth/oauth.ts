import "server-only";
import { cookies } from "next/headers";
import { randomToken } from "./password";
import { absoluteUrl } from "@/lib/utils";

/*
 * Signing in with Google.
 *
 * The plain authorisation-code flow, by hand, so the website keeps its own users
 * table and its own sessions rather than handing either to a library. The steps:
 *
 *   1. /api/auth/google sends the person to Google with a one-time "state".
 *   2. Google sends them back to /api/auth/google/callback with a code.
 *   3. We swap the code for a token, read the profile, and sign them in.
 *
 * The state is kept in a short-lived cookie and compared on the way back. Without
 * it, somebody could feed a victim's browser a callback link of their own and sign
 * them into the wrong account. Where to go afterwards also travels in that cookie,
 * never in the URL, so nobody can turn the callback into a redirect to their site.
 */

const AUTHORIZE = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";
const PROFILE = "https://openidconnect.googleapis.com/v1/userinfo";

export const STATE_COOKIE = "ksa_oauth";

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  return { clientId, clientSecret, ready: Boolean(clientId && clientSecret) };
}

/** True when the website can offer "Continue with Google". */
export const googleEnabled = () => googleConfig().ready;

export const googleRedirectUri = () => absoluteUrl("/api/auth/google/callback");

/** Only our own pages, never an address somebody put in the query string. */
export function safeNext(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export async function startGoogle(next: string) {
  const { clientId } = googleConfig();
  const state = randomToken(24);
  const jar = await cookies();
  jar.set(STATE_COOKIE, `${state}|${next}`, {
    httpOnly: true,
    secure: googleRedirectUri().startsWith("https://"),
    sameSite: "lax", // must survive the trip back from Google
    path: "/",
    maxAge: 600,
  });
  const url = new URL(AUTHORIZE);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  // Always ask which account, rather than silently using the one already signed in.
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

/** Reads and clears the state cookie, returning where to go next if it matches. */
export async function takeState(state: string | null) {
  const jar = await cookies();
  const raw = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);
  if (!raw || !state) return null;
  const [saved, next] = raw.split("|");
  if (saved !== state) return null;
  return safeNext(next);
}

export type GoogleProfile = { email: string; name: string; emailVerified: boolean };

/** Swaps the code for the person's Google profile. Throws with a plain reason. */
export async function googleProfile(code: string): Promise<GoogleProfile> {
  const { clientId, clientSecret } = googleConfig();
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!res.ok) throw new Error(`Google refused the sign-in (${res.status})`);
  const token = (await res.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Google did not return a token");

  const me = await fetch(PROFILE, { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!me.ok) throw new Error(`Google would not share the profile (${me.status})`);
  const p = (await me.json()) as { email?: string; name?: string; given_name?: string; email_verified?: boolean };
  if (!p.email) throw new Error("Google did not share an email address");
  return {
    email: p.email.toLowerCase(),
    name: (p.name || p.given_name || p.email.split("@")[0]).slice(0, 120),
    emailVerified: p.email_verified !== false,
  };
}
