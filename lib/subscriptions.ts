import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { randomToken } from "@/lib/auth/password";
import { marketingConsentText } from "@/lib/content";
import { absoluteUrl } from "@/lib/utils";

/**
 * Records opt-in consent (who, when, what wording, where). Re-subscribes if
 * previously unsubscribed. `created` is true only the first time an address
 * joins, so alerts are not sent again for someone already on the list.
 */
export async function subscribe(opts: { email: string; name?: string | null; userId?: string | null; source: string; ip?: string | null }) {
  const email = opts.email.trim().toLowerCase();
  const [existing] = await db.select().from(schema.emailSubscriptions).where(eq(schema.emailSubscriptions.email, email)).limit(1);
  if (existing) {
    const wasOut = existing.status === "unsubscribed";
    await db
      .update(schema.emailSubscriptions)
      .set({
        status: "subscribed",
        userId: existing.userId ?? opts.userId ?? null,
        name: existing.name ?? opts.name ?? null,
        ...(wasOut ? { consentedAt: new Date(), unsubscribedAt: null, consentText: marketingConsentText, source: opts.source } : {}),
      })
      .where(eq(schema.emailSubscriptions.id, existing.id));
    if (wasOut) await db.insert(schema.consentEvents).values({ subscriptionId: existing.id, action: "resubscribed", source: opts.source, ip: opts.ip ?? null });
    return { id: existing.id, created: wasOut };
  }
  const [row] = await db
    .insert(schema.emailSubscriptions)
    .values({
      email,
      name: opts.name ?? null,
      userId: opts.userId ?? null,
      source: opts.source,
      consentText: marketingConsentText,
      unsubscribeToken: randomToken(24),
    })
    .returning({ id: schema.emailSubscriptions.id });
  await db.insert(schema.consentEvents).values({ subscriptionId: row.id, action: "subscribed", source: opts.source, ip: opts.ip ?? null });
  return { id: row.id, created: true };
}

export async function unsubscribeByToken(token: string, source = "link", ip?: string | null) {
  const [sub] = await db.select().from(schema.emailSubscriptions).where(eq(schema.emailSubscriptions.unsubscribeToken, token)).limit(1);
  if (!sub) return null;
  if (sub.status !== "unsubscribed") {
    await db.update(schema.emailSubscriptions).set({ status: "unsubscribed", unsubscribedAt: new Date() }).where(eq(schema.emailSubscriptions.id, sub.id));
    await db.insert(schema.consentEvents).values({ subscriptionId: sub.id, action: "unsubscribed", source, ip: ip ?? null });
  }
  return sub;
}

export async function setSubscriptionForUser(user: { id: string; email: string; name: string }, wantEmails: boolean, ip?: string | null) {
  if (wantEmails) return subscribe({ email: user.email, name: user.name, userId: user.id, source: "account_settings", ip });
  const [sub] = await db.select().from(schema.emailSubscriptions).where(eq(schema.emailSubscriptions.email, user.email.toLowerCase())).limit(1);
  if (sub) await unsubscribeByToken(sub.unsubscribeToken, "account_settings", ip);
}

export const unsubscribeUrl = (token: string) => absoluteUrl(`/unsubscribe?token=${token}`);
