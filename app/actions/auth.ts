"use server";

import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { describeDbError, logDbError } from "@/lib/db/errors";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { hashPassword, randomToken, sha256, verifyPassword } from "@/lib/auth/password";
import { getClientInfo } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { notifyTeam } from "@/lib/notify";
import { subscribe } from "@/lib/subscriptions";
import { sendPasswordReset, sendVerifyEmail } from "@/lib/email/templates";
import { emailOnlySchema, fieldErrors, formObject, loginSchema, passwordRule, registerSchema, type ActionState } from "@/lib/validation";

// Same cost as a real check, so response time does not reveal whether an email has an account.
const DUMMY_HASH = "scrypt$c2FsdHNhbHRzYWx0c2FsdA==$" + Buffer.alloc(64).toString("base64");

/** Only allow redirects back into this site. */
function safeNext(next: unknown, fallback = "/dashboard") {
  const n = typeof next === "string" ? next.trim() : "";
  // Must be a local path. Blocks "//evil.com", "/\\evil.com" and control characters.
  if (!n.startsWith("/") || n.startsWith("//") || /[\\\s\u0000-\u001f]/.test(n) || n.length > 500) return fallback;
  try {
    const u = new URL(n, "http://local.invalid");
    return u.origin === "http://local.invalid" ? u.pathname + u.search + u.hash : fallback;
  } catch {
    return fallback;
  }
}

/** A friendly message when the database is unreachable, instead of a crash. */
function dbProblem(label: string, e: unknown, data?: Record<string, string>): ActionState {
  logDbError(label, e);
  const d = describeDbError(e);
  const detail = process.env.NODE_ENV === "production" ? "" : ` (${d.reason} ${d.fix})`;
  return { ok: false, message: `We could not reach the database. Please try again shortly.${detail}`, data };
}

async function issueToken(userId: string, type: "verify_email" | "reset_password", hours: number) {
  const token = randomToken(32);
  await db.insert(schema.authTokens).values({
    userId,
    type,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + hours * 3600_000),
  });
  return token;
}

export async function register(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = formObject(fd);
  delete raw.password;
  const { ip } = await getClientInfo();
  if (!rateLimit(`register:${ip}`, 6, 15 * 60_000).ok) return { ok: false, message: "Too many sign-up attempts. Please try again in a few minutes.", data: raw };
  const parsed = registerSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), data: raw };
  const d = parsed.data;

  try {
    const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, d.email)).limit(1);
    if (existing) return { ok: false, errors: { email: "An account with this email already exists. Log in instead." }, data: raw };

    const [user] = await db
      .insert(schema.users)
      .values({
        email: d.email,
        name: d.name,
        passwordHash: await hashPassword(d.password),
        country: d.country || null,
        institution: d.institution || null,
      })
      .returning();

    // Marketing consent is optional and stored separately from the account.
    if (d.marketing === "on") await subscribe({ email: user.email, name: user.name, userId: user.id, source: "registration", ip });
    await notifyTeam({
      event: "new_user",
      subject: "New account on the website",
      headline: `${user.name} created an account`,
      rows: [
        ["Name", user.name],
        ["Email", user.email],
        ["Country", d.country || "Not given"],
        ["Institution", d.institution || "Not given"],
        ["Marketing emails", d.marketing === "on" ? "Yes" : "No"],
      ],
      link: `/admin/users/${user.id}`,
      linkLabel: "See this person",
    });

    const token = await issueToken(user.id, "verify_email", 48);
    await sendVerifyEmail(user.email, user.name, token).catch((e) => console.error(e));
    await createSession(user.id);
  } catch (e) {
    return dbProblem("register", e, raw);
  }
  redirect(safeNext(fd.get("next")));
}

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = { email: String(fd.get("email") ?? "") };
  const { ip } = await getClientInfo();
  const email = raw.email.trim().toLowerCase();
  if (!rateLimit(`login:${ip}`, 12, 15 * 60_000).ok || !rateLimit(`login:${email}`, 8, 15 * 60_000).ok)
    return { ok: false, message: "Too many login attempts. Please wait 15 minutes or reset your password.", data: raw };
  const parsed = loginSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), data: raw };

  let user: typeof schema.users.$inferSelect | undefined;
  try {
    [user] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email)).limit(1);
  } catch (e) {
    return dbProblem("login", e, raw);
  }
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : await verifyPassword("x", DUMMY_HASH);
  if (!user || !valid) return { ok: false, message: "That email and password do not match. Check them and try again.", data: raw };
  if (user.status === "suspended") return { ok: false, message: "This account is suspended. Please contact us for help.", data: raw };

  await createSession(user.id);
  redirect(safeNext(fd.get("next"), user.role === "admin" ? "/admin" : "/dashboard"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { ip } = await getClientInfo();
  if (!rateLimit(`reset:${ip}`, 5, 15 * 60_000).ok) return { ok: false, message: "Too many requests. Please try again later." };
  const parsed = emailOnlySchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email)).limit(1);
    if (user && user.status === "active") {
      const token = await issueToken(user.id, "reset_password", 1);
      await sendPasswordReset(user.email, token).catch((e) => console.error(e));
    }
  } catch (e) {
    return dbProblem("password reset request", e);
  }
  // Same answer either way, so the form cannot be used to discover accounts.
  return { ok: true, message: "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder." };
}

export async function resetPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const token = String(fd.get("token") ?? "");
  const password = passwordRule.safeParse(String(fd.get("password") ?? ""));
  if (!password.success) return { ok: false, errors: { password: password.error.issues[0].message } };
  if (fd.get("password") !== fd.get("confirm")) return { ok: false, errors: { confirm: "The passwords do not match." } };

  const [row] = await db
    .select()
    .from(schema.authTokens)
    .where(
      and(
        eq(schema.authTokens.tokenHash, sha256(token)),
        eq(schema.authTokens.type, "reset_password"),
        isNull(schema.authTokens.usedAt),
        gt(schema.authTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) return { ok: false, message: "This reset link has expired or was already used. Request a new one." };

  await db.update(schema.users).set({ passwordHash: await hashPassword(password.data), emailVerifiedAt: new Date() }).where(eq(schema.users.id, row.userId));
  await db.update(schema.authTokens).set({ usedAt: new Date() }).where(eq(schema.authTokens.id, row.id));
  // Sign out every other device after a password change.
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, row.userId));
  await createSession(row.userId);
  redirect("/dashboard?reset=1");
}

export async function verifyEmailToken(token: string) {
  const [row] = await db
    .select()
    .from(schema.authTokens)
    .where(and(eq(schema.authTokens.tokenHash, sha256(token)), eq(schema.authTokens.type, "verify_email"), gt(schema.authTokens.expiresAt, new Date())))
    .limit(1);
  if (!row) return false;
  await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, row.userId));
  if (!row.usedAt) await db.update(schema.authTokens).set({ usedAt: new Date() }).where(eq(schema.authTokens.id, row.id));
  return true;
}

export async function resendVerification(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerified) return { ok: true, message: "Your email is already confirmed." };
  if (!rateLimit(`verify:${user.id}`, 3, 30 * 60_000).ok) return { ok: false, message: "Please wait a little before asking for another email." };
  const token = await issueToken(user.id, "verify_email", 48);
  await sendVerifyEmail(user.email, user.name, token);
  return { ok: true, message: "We sent a new confirmation link to your email." };
}
