import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { googleEnabled, googleProfile, takeState } from "@/lib/auth/oauth";
import { createSession } from "@/lib/auth/session";
import { hashPassword, randomToken } from "@/lib/auth/password";
import { getClientInfo } from "@/lib/request";
import { notifyTeam } from "@/lib/notify";

/**
 * Step two: Google sends the person back here.
 *
 * An account is matched by email address, which is safe because Google tells us
 * whether it has verified that address and we refuse the sign-in when it has not.
 * A person who first registered with a password and later presses "Continue with
 * Google" therefore lands in their existing account rather than a second one.
 */
export async function GET(req: Request) {
  if (!googleEnabled()) redirect("/login?oauth=off");
  const params = new URL(req.url).searchParams;

  // The person pressed "cancel" on Google's screen.
  if (params.get("error")) redirect("/login?oauth=cancelled");

  const next = await takeState(params.get("state"));
  const code = params.get("code");
  if (!next || !code) redirect("/login?oauth=failed");

  let profile;
  try {
    profile = await googleProfile(code);
  } catch (e) {
    console.error("[google] sign-in failed:", e instanceof Error ? e.message : e);
    redirect("/login?oauth=failed");
  }
  if (!profile.emailVerified) redirect("/login?oauth=unverified");

  const [existing] = await db
    .select({ id: schema.users.id, status: schema.users.status, emailVerifiedAt: schema.users.emailVerifiedAt })
    .from(schema.users)
    .where(eq(schema.users.email, profile.email))
    .limit(1);

  if (existing) {
    if (existing.status !== "active") redirect("/login?oauth=blocked");
    // Google has checked this address, so an account that signed up by email and
    // never clicked the link in it counts as verified from here on.
    if (!existing.emailVerifiedAt) {
      await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, existing.id));
    }
    await createSession(existing.id);
    redirect(next);
  }

  // New person. The password is random and never shown to anybody: this account
  // is opened with Google. "Forgot password" still works if they want one later.
  const { ip } = await getClientInfo();
  const [created] = await db
    .insert(schema.users)
    .values({
      email: profile.email,
      name: profile.name,
      passwordHash: await hashPassword(randomToken(32)),
      emailVerifiedAt: new Date(),
      oauthProvider: "google",
    })
    .returning({ id: schema.users.id });

  await notifyTeam({
    event: "new_user",
    subject: `New account: ${profile.name}`,
    headline: `${profile.name} created an account with Google`,
    rows: [
      ["Name", profile.name],
      ["Email", profile.email],
      ["Signed up with", "Google"],
      ["IP", ip ?? ""],
    ],
    link: `/admin/users/${created.id}`,
    linkLabel: "Open the account",
  }).catch(() => {});

  await createSession(created.id);
  redirect(next);
}
