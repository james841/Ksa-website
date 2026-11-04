"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { paymentsEnabled } from "@/lib/payments/payfast";

/**
 * Starts a course payment: saves a pending payment and sends the learner to the
 * checkout page, which posts the signed form to PayFast. Nothing here grants
 * access; only PayFast's confirmation does (see /api/payfast/notify).
 */
export async function startCoursePayment(slug: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);

  const [course] = await db.select().from(schema.courses).where(eq(schema.courses.slug, slug)).limit(1);
  if (!course || course.status !== "published") redirect(`/courses/${slug}`);
  if (course.priceCents <= 0 || !paymentsEnabled()) redirect(`/courses/${slug}`);

  // Already paid for, or already enrolled? Go straight to the course.
  const [existing] = await db
    .select({ id: schema.enrollments.id })
    .from(schema.enrollments)
    .where(and(eq(schema.enrollments.courseId, course.id), eq(schema.enrollments.userId, user.id)))
    .limit(1);
  if (existing) redirect(`/dashboard/courses`);

  const reference = `KSA-${course.slug.slice(0, 12)}-${randomUUID().slice(0, 8)}`.toUpperCase();
  const [payment] = await db
    .insert(schema.payments)
    .values({
      reference,
      userId: user.id,
      courseId: course.id,
      amountCents: course.priceCents,
      currency: course.currency,
      email: user.email,
    })
    .returning({ id: schema.payments.id });

  redirect(`/checkout/${payment.id}`);
}
