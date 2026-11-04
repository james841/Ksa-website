import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { verifyItn } from "@/lib/payments/payfast";
import { notifyTeam } from "@/lib/notify";

/**
 * PayFast's Instant Transaction Notification.
 *
 * PayFast calls this from its own servers after a payment, whether or not the
 * learner comes back to the website. This is the only place that marks a
 * payment as paid and gives the learner access to the course.
 *
 * PayFast expects a 200 even when we reject the data, otherwise it keeps
 * retrying; the reason is written to the server log instead.
 */
export async function POST(req: Request) {
  const text = await req.text();
  const body = Object.fromEntries(new URLSearchParams(text)) as Record<string, string>;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const reference = body.m_payment_id ?? "";

  const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.reference, reference)).limit(1);
  if (!payment) {
    console.error(`[payfast] no payment found for reference "${reference}"`);
    return new Response("ok");
  }
  if (payment.status === "paid") return new Response("ok"); // already handled

  const check = await verifyItn(body, ip, payment.amountCents);
  if (!check.ok) {
    console.error(`[payfast] rejected ITN for ${reference}: ${check.reason}`);
    await db.update(schema.payments).set({ status: "failed", raw: body }).where(eq(schema.payments.id, payment.id));
    return new Response("ok");
  }

  const status = body.payment_status === "COMPLETE" ? "paid" : body.payment_status === "CANCELLED" ? "cancelled" : "failed";
  await db
    .update(schema.payments)
    .set({ status, raw: body, providerPaymentId: body.pf_payment_id ?? null, paidAt: status === "paid" ? new Date() : null })
    .where(eq(schema.payments.id, payment.id));

  if (status !== "paid") return new Response("ok");

  // Give access. The unique index means a repeated notification changes nothing.
  await db
    .insert(schema.enrollments)
    .values({ courseId: payment.courseId, userId: payment.userId, source: "self" })
    .onConflictDoNothing();

  const [course] = await db.select({ title: schema.courses.title, id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.id, payment.courseId)).limit(1);
  const [learner] = await db.select({ name: schema.users.name, email: schema.users.email }).from(schema.users).where(eq(schema.users.id, payment.userId)).limit(1);

  await notifyTeam({
    event: "course_enrolment",
    subject: `Course paid for: ${course?.title ?? "course"}`,
    headline: `${learner?.name ?? "A learner"} paid for ${course?.title ?? "a course"}`,
    rows: [
      ["Course", course?.title ?? ""],
      ["Learner", `${learner?.name ?? ""} (${learner?.email ?? ""})`],
      ["Amount", `${payment.currency} ${(payment.amountCents / 100).toFixed(2)}`],
      ["Reference", payment.reference],
      ["PayFast id", body.pf_payment_id ?? ""],
    ],
    link: course ? `/admin/courses/${course.id}` : "/admin/courses",
    linkLabel: "Open the course",
  });

  return new Response("ok");
}
