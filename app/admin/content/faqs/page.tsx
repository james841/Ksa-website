import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { deleteFaq, moveFaq, saveFaq } from "@/app/actions/admin/content";
import { ActionButton, AdminForm, ConfirmAction } from "@/components/admin/forms";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/forms/fields";
import { ChevronDown } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "FAQs" };

function FaqFields({ faq }: { faq?: typeof schema.faqs.$inferSelect }) {
  return (
    <>
      {faq ? <input suppressHydrationWarning type="hidden" name="id" value={faq.id} /> : null}
      <label className="block">
        <span className="field-label">Question</span>
        <input suppressHydrationWarning name="question" required defaultValue={faq?.question} className="field" />
      </label>
      <label className="block">
        <span className="field-label">Answer</span>
        <textarea suppressHydrationWarning name="answer" required defaultValue={faq?.answer} className="field min-h-28" />
      </label>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3 text-sm font-medium">
          <input suppressHydrationWarning type="checkbox" name="published" defaultChecked={faq?.published ?? true} className="size-5 accent-blue" />
          Show on the FAQ page
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input suppressHydrationWarning type="checkbox" name="showOnHome" defaultChecked={faq?.showOnHome ?? false} className="size-5 accent-blue" />
          Also show on the homepage
        </label>
      </div>
    </>
  );
}

export default async function FaqsAdmin() {
  await requirePermission("content");
  const faqs = await db.select().from(schema.faqs).orderBy(asc(schema.faqs.position));
  return (
    <>
      <PageHeader
        back={{ href: "/admin/content", label: "Site settings" }}
        title="FAQs"
        description="Published FAQs are also added to Google as structured FAQ data, which can help your answers appear in search."
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={`Questions (${faqs.length})`}>
          <ol className="space-y-3">
            {faqs.map((f, i) => (
              <li key={f.id} className="rounded-2xl border border-line">
                <div className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 text-sm font-semibold text-muted">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{f.question}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{f.answer}</p>
                    <p className="mt-2 flex gap-2">
                      {!f.published ? <Badge value="draft" label="Hidden" /> : null}
                      {f.showOnHome ? <Badge value="coming_soon" label="On homepage" /> : null}
                    </p>
                  </div>
                  <ActionButton action={moveFaq} hidden={{ id: f.id, dir: "up" }} className="px-2.5" success="Order updated">
                    ↑
                  </ActionButton>
                  <ActionButton action={moveFaq} hidden={{ id: f.id, dir: "down" }} className="px-2.5" success="Order updated">
                    ↓
                  </ActionButton>
                </div>
                <details className="group border-t border-line px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-blue">
                    Edit <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <AdminForm action={saveFaq} className="mt-4" successTitle="FAQ saved">
                    <FaqFields faq={f} />
                    <SubmitButton variant="dark">Save</SubmitButton>
                  </AdminForm>
                  <div className="mt-3 flex justify-end">
                    <ConfirmAction action={deleteFaq} hidden={{ id: f.id }} label="Delete" confirmLabel="Delete question" success="FAQ deleted" />
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Add a question">
          <AdminForm action={saveFaq} resetOnSuccess successTitle="FAQ saved">
            <FaqFields />
            <SubmitButton>Add FAQ</SubmitButton>
          </AdminForm>
        </Panel>
      </div>
    </>
  );
}
