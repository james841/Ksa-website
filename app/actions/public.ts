"use server";

import { sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getClientInfo } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { subscribe } from "@/lib/subscriptions";
import { sendQuoteReceipt } from "@/lib/email/templates";
import { notifyTeam } from "@/lib/notify";
import { fieldErrors, formObject, newsletterSchema, quoteSchema, type ActionState } from "@/lib/validation";

export async function subscribeNewsletter(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (fd.get("website")) return { ok: true, message: "Thanks, you're subscribed." }; // honeypot
  const { ip } = await getClientInfo();
  if (!rateLimit(`news:${ip}`, 5, 60_000).ok) return { ok: false, message: "Too many attempts. Please wait a minute and try again." };
  const parsed = newsletterSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), data: formObject(fd) };
  try {
    const sub = await subscribe({ email: parsed.data.email, name: parsed.data.name || null, source: String(fd.get("source") || "footer"), ip });
    if (sub.created)
      await notifyTeam({
        event: "subscriber",
        subject: "New email subscriber",
        headline: `${parsed.data.name || parsed.data.email} joined the mailing list`,
        rows: [
          ["Email", parsed.data.email],
          ["Name", parsed.data.name || "Not given"],
          ["Signed up from", String(fd.get("source") || "footer")],
        ],
        link: "/admin/subscribers",
        linkLabel: "See all subscribers",
      });
    return { ok: true, message: "Thanks, you're subscribed. Look out for our next webinar announcement." };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "We couldn't save your subscription. Please try again." };
  }
}

export async function submitQuote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = formObject(fd);
  if (fd.get("website")) return { ok: true, message: "Thank you. We have received your request." };
  const { ip } = await getClientInfo();
  if (!rateLimit(`quote:${ip}`, 5, 10 * 60_000).ok)
    return { ok: false, message: "You have sent several requests in a short time. Please wait a few minutes.", data: raw };
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), data: raw };

  const user = await getCurrentUser();
  const d = parsed.data;
  try {
    const [{ n }] = await db.execute<{ n: number }>(sql`select count(*)::int + 1 as n from quote_requests`).then((r) => r.rows);
    const reference = `KSA-${new Date().getUTCFullYear()}-${String(n).padStart(4, "0")}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
    const [row] = await db
      .insert(schema.quoteRequests)
      .values({
        reference,
        name: d.name,
        email: d.email,
        country: d.country,
        phone: d.phone,
        service: d.service,
        description: d.description,
        promoCode: d.promoCode || null,
        userId: user?.id ?? null,
        ip,
      })
      .returning();
    // Emails should never block or break the submission.
    await Promise.allSettled([
      sendQuoteReceipt(d.email, d.name, reference, d.service),
      notifyTeam({
        event: "quote",
        subject: `New service request: ${row.service} (${row.reference})`,
        headline: `${row.name} asked about ${row.service}`,
        rows: [
          ["Reference", row.reference],
          ["Name", row.name],
          ["Email", row.email],
          ["Phone", row.phone],
          ["Country", row.country],
          ["Service", row.service],
          ["Promo code", row.promoCode || "None"],
        ],
        note: row.description,
        link: `/admin/quotes/${row.id}`,
        linkLabel: "Open this request",
        replyTo: row.email,
      }),
    ]);
    return { ok: true, message: reference };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "We couldn't send your request. Please try again or email us directly.", data: raw };
  }
}
