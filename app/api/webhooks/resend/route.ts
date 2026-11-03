import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Resend delivery webhooks (signed with Svix). Add this URL in Resend > Webhooks
 * and paste the signing secret into RESEND_WEBHOOK_SECRET.
 * Bounces and spam complaints automatically unsubscribe the address.
 */
function verify(secret: string, id: string, ts: string, body: string, signatures: string) {
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64");
  return signatures.split(" ").some((part) => {
    const sig = part.split(",")[1] ?? "";
    return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  });
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const body = await req.text();
  if (!secret) return new Response("Webhook secret not configured", { status: 501 });
  const ok = verify(secret, req.headers.get("svix-id") ?? "", req.headers.get("svix-timestamp") ?? "0", body, req.headers.get("svix-signature") ?? "");
  if (!ok) return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(body) as { type: string; data: { email_id?: string; to?: string[] } };
  const map: Record<string, "delivered" | "bounced" | "complained"> = {
    "email.delivered": "delivered",
    "email.bounced": "bounced",
    "email.complained": "complained",
  };
  const status = map[event.type];
  if (status && event.data.email_id) {
    const [rec] = await db
      .update(schema.campaignRecipients)
      .set({ status })
      .where(eq(schema.campaignRecipients.providerId, event.data.email_id))
      .returning();
    if (rec && status !== "delivered" && rec.subscriptionId) {
      await db
        .update(schema.emailSubscriptions)
        .set({ status: "unsubscribed", unsubscribedAt: new Date() })
        .where(eq(schema.emailSubscriptions.id, rec.subscriptionId));
      await db.insert(schema.consentEvents).values({ subscriptionId: rec.subscriptionId, action: status, source: "resend_webhook" });
    }
  }
  return new Response("ok");
}
