import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { and, eq, gt, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { randomToken, sha256 } from "./password";
import { getClientInfo } from "@/lib/request";
import { can, type Section, type StaffRole } from "./permissions";

// "__Host-" makes browsers refuse the cookie unless it is Secure, host-only and path=/ (stops subdomain cookie tricks).
// Only on an https site, so local testing over http (npm run dev / npm start) still logs in fine.
const HTTPS = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
export const SESSION_COOKIE = HTTPS ? "__Host-ksa_session" : "ksa_session";
const SESSION_DAYS = 30;

/*
 * Idle timeout.
 *
 * A session lasts 30 days, but it also has to be used. Go quiet for longer than
 * the window below and the session is ended on the next request, whoever you are
 * and whatever the cookie says. Staff get a shorter window than learners because
 * an admin screen left open in a shared office is the bigger risk.
 *
 * Both can be changed with SESSION_IDLE_MINUTES and STAFF_IDLE_MINUTES.
 */
const minutes = (v: string | undefined, fallback: number) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) && n >= 5 ? n : fallback;
};
export const IDLE_MINUTES = minutes(process.env.SESSION_IDLE_MINUTES, 120);
export const STAFF_IDLE_MINUTES = minutes(process.env.STAFF_IDLE_MINUTES, 30);
/** Only write "last seen" again after this long, so a busy page is not a write per click. */
const TOUCH_AFTER_MS = 2 * 60 * 1000;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  /** Admin team role. Older admin accounts with no role set count as super admins. */
  staffRole: StaffRole | null;
  emailVerified: boolean;
};

export async function createSession(userId: string) {
  // Never reuse an old session id after login (prevents session fixation).
  const old = (await cookies()).get(SESSION_COOKIE)?.value;
  if (old) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(old)));
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const { ip, userAgent } = await getClientInfo();
  await db.insert(schema.sessions).values({ id: sha256(token), userId, expiresAt, ip, userAgent });
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, userId));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: HTTPS,
    sameSite: "lax",
    priority: "high",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

/** Reads the session cookie and returns the signed-in user, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      staffRole: schema.users.staffRole,
      status: schema.users.status,
      emailVerifiedAt: schema.users.emailVerifiedAt,
      lastSeenAt: schema.sessions.lastSeenAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, sql`now()`)))
    .limit(1);
  const u = rows[0];
  if (!u || u.status !== "active") return null;
  const staffRole = u.role === "admin" ? (u.staffRole ?? "super_admin") : null;

  // Idle check. The server decides this, not the browser: a tab left open
  // overnight is signed out even if nothing on the page ever noticed.
  const idleMs = (staffRole ? STAFF_IDLE_MINUTES : IDLE_MINUTES) * 60 * 1000;
  const quietFor = Date.now() - u.lastSeenAt.getTime();
  if (quietFor > idleMs) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token))).catch(() => {});
    return null;
  }
  // Mark it used, but not on every single request.
  if (quietFor > TOUCH_AFTER_MS) {
    await db
      .update(schema.sessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(schema.sessions.id, sha256(token)))
      .catch(() => {});
  }

  return { id: u.id, name: u.name, email: u.email, role: u.role, staffRole, emailVerified: !!u.emailVerifiedAt };
});

/** How long this person may stay idle, in minutes. For the on-screen warning. */
export async function idleWindowMinutes() {
  const user = await getCurrentUser();
  return user?.staffRole ? STAFF_IDLE_MINUTES : IDLE_MINUTES;
}

/** Keeps the session alive after real activity in the browser. */
export async function touchSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const res = await db
    .update(schema.sessions)
    .set({ lastSeenAt: new Date() })
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, sql`now()`)))
    .returning({ id: schema.sessions.id });
  return res.length > 0;
}

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  // Private pages are always rendered per request (they show the current time, progress, etc.).
  await connection();
  return user;
}

/** Anyone on the admin team (any staff role). Used by the admin layout. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin" || !user.staffRole) redirect("/dashboard");
  await connection();
  return user as SessionUser & { staffRole: StaffRole };
}

/**
 * Server-side gate for one admin section. Call it in every admin page AND every
 * admin server action. Team members without access are sent to the dashboard.
 */
export async function requirePermission(...sections: Section[]) {
  const user = await requireAdmin();
  if (!sections.some((s) => can(user.staffRole, s))) redirect("/admin?denied=1");
  return user;
}
