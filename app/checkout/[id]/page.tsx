import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkoutFields, formatPrice, paymentsEnabled } from "@/lib/payments/payfast";
import { Logo } from "@/components/layout/logo";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Going to PayFast", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: PageProps<"/checkout/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!/^[0-9a-f-]{36}$/.test(id) || !paymentsEnabled()) notFound();

  const [row] = await db
    .select({
      payment: schema.payments,
      courseTitle: schema.courses.title,
      courseSlug: schema.courses.slug,
      courseSummary: schema.courses.summary,
    })
    .from(schema.payments)
    .innerJoin(schema.courses, eq(schema.courses.id, schema.payments.courseId))
    .where(and(eq(schema.payments.id, id), eq(schema.payments.userId, user.id)))
    .limit(1);
  if (!row) notFound();
  if (row.payment.status === "paid") redirect(`/courses/${row.courseSlug}?payment=done`);

  const { action, fields } = checkoutFields({
    reference: row.payment.reference,
    amountCents: row.payment.amountCents,
    itemName: row.courseTitle,
    itemDescription: row.courseSummary,
    firstName: user.name.split(" ")[0],
    email: user.email,
    courseSlug: row.courseSlug,
  });

  return (
    <main className="grid min-h-dvh place-items-center bg-mist px-5 py-16">
      <div className="w-full max-w-md rounded-[1.5rem] bg-white p-8 text-center shadow-soft ring-1 ring-line">
        <Logo className="mx-auto h-9 w-auto" />
        <h1 className="mt-7 font-display text-2xl text-ink">Taking you to PayFast</h1>
        <p className="mt-2 text-muted">
          {row.courseTitle} — <strong className="text-ink">{formatPrice(row.payment.amountCents, row.payment.currency)}</strong>
        </p>
        <p className="mt-4 text-sm text-muted">
          PayFast handles the card details. Your card number never reaches this website.
        </p>

        <form id="payfast" method="post" action={action} className="mt-7">
          {fields.map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <button type="submit" className="btn btn-primary w-full">
            Continue to PayFast
          </button>
        </form>
        <p className="mt-4 text-xs text-muted">
          Reference {row.payment.reference}. If nothing happens in a few seconds, press the button above.
        </p>
      </div>
      {/* Sends the form by itself, while keeping the button for anyone with JavaScript off. */}
      <script dangerouslySetInnerHTML={{ __html: `setTimeout(function(){var f=document.getElementById('payfast');if(f)f.submit();},700)` }} />
    </main>
  );
}
