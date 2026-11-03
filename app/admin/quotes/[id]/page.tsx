import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { addQuoteNote, deleteQuote, replyToQuote, updateQuote } from "@/app/actions/admin/people";
import { AdminForm, ConfirmAction } from "@/components/admin/forms";
import { Badge, DefinitionList, PageHeader, Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/forms/fields";
import { dateToLocalInput } from "@/lib/time";
import { formatDateTime } from "@/lib/utils";
import { Mail, Phone, WhatsApp } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Quote request" };

export default async function QuoteDetail({ params }: PageProps<"/admin/quotes/[id]">) {
  await requirePermission("quotes");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [q] = await db.select().from(schema.quoteRequests).where(eq(schema.quoteRequests.id, id)).limit(1);
  if (!q) notFound();
  const notes = await db
    .select({ id: schema.quoteNotes.id, body: schema.quoteNotes.body, createdAt: schema.quoteNotes.createdAt, author: schema.users.name })
    .from(schema.quoteNotes)
    .leftJoin(schema.users, eq(schema.users.id, schema.quoteNotes.authorId))
    .where(eq(schema.quoteNotes.quoteId, id))
    .orderBy(desc(schema.quoteNotes.createdAt));
  const wa = q.phone.replace(/[^\d]/g, "");

  return (
    <>
      <PageHeader
        back={{ href: "/admin/quotes", label: "All quote requests" }}
        title={q.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge value={q.status} /> {q.reference} · received {formatDateTime(q.createdAt)}
          </span>
        }
        actions={
          <>
            <a href={`mailto:${q.email}?subject=${encodeURIComponent(`Your request ${q.reference}`)}`} className="btn btn-ghost btn-sm">
              <Mail size={16} /> Email
            </a>
            <a href={`tel:${q.phone}`} className="btn btn-ghost btn-sm">
              <Phone size={16} /> Call
            </a>
            {wa.length > 6 ? (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                <WhatsApp size={16} /> WhatsApp
              </a>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Request">
            <DefinitionList
              items={[
                ["Service", q.service],
                ["Promo code", q.promoCode],
                ["Email", <a key="e" href={`mailto:${q.email}`} className="text-blue underline-offset-2 hover:underline">{q.email}</a>],
                ["Phone", q.phone],
                ["Country / location", q.country],
                ["Account", q.userId ? <a key="u" href={`/admin/users/${q.userId}`} className="text-blue hover:underline">Registered user</a> : "Sent as a guest"],
              ]}
            />
            <div className="mt-6 rounded-xl bg-mist p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Description</p>
              <p className="whitespace-pre-wrap leading-relaxed text-ink">{q.description}</p>
            </div>
          </Panel>

          <Panel title="Reply by email" description="Sent from your Resend address. The client's reply comes back to your inbox.">
            <AdminForm action={replyToQuote} resetOnSuccess successTitle="Reply sent">
              <input suppressHydrationWarning type="hidden" name="id" value={q.id} />
              <div>
                <label className="field-label" htmlFor="r-subject">
                  Subject
                </label>
                <input suppressHydrationWarning id="r-subject" name="subject" className="field" required defaultValue={`Re: your ${q.service} request (${q.reference})`} />
              </div>
              <div>
                <label className="field-label" htmlFor="r-msg">
                  Message
                </label>
                <textarea suppressHydrationWarning id="r-msg" name="message" required className="field min-h-44" defaultValue={`Dear ${q.name.split(" ")[0]},\n\nThank you for contacting Knowledge Space Academy.\n\n\n\nKind regards,\nKnowledge Space Academy`} />
              </div>
              <SubmitButton pendingText="Sending…">Send reply</SubmitButton>
            </AdminForm>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Status and follow-up">
            <AdminForm action={updateQuote} successTitle="Request updated">
              <input suppressHydrationWarning type="hidden" name="id" value={q.id} />
              <div>
                <label className="field-label" htmlFor="q-status">
                  Status
                </label>
                <select suppressHydrationWarning id="q-status" name="status" defaultValue={q.status} className="field">
                  <option value="new">New</option>
                  <option value="in_progress">In progress</option>
                  <option value="responded">Responded</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="q-follow">
                  Follow-up reminder <span className="font-normal text-muted">(optional)</span>
                </label>
                <input suppressHydrationWarning id="q-follow" type="datetime-local" name="followUpAt" defaultValue={dateToLocalInput(q.followUpAt)} className="field" />
                <p className="mt-1.5 text-xs text-muted">Shows on the dashboard when it is due. Times are Lagos time (WAT).</p>
              </div>
              <SubmitButton variant="dark">Save</SubmitButton>
            </AdminForm>
          </Panel>

          <Panel title="Internal notes" description="Only admins can see these.">
            <AdminForm action={addQuoteNote} resetOnSuccess successTitle="Note added">
              <input suppressHydrationWarning type="hidden" name="id" value={q.id} />
              <textarea suppressHydrationWarning name="body" required placeholder="e.g. Called on Monday, sending a proposal by Friday." className="field min-h-24" />
              <SubmitButton variant="ghost">Add note</SubmitButton>
            </AdminForm>
            {notes.length ? (
              <ol className="mt-6 space-y-4 border-l-2 border-line pl-4">
                {notes.map((n) => (
                  <li key={n.id}>
                    <p className="text-xs text-muted">
                      <strong className="text-ink">{n.author ?? "Admin"}</strong> · {formatDateTime(n.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{n.body}</p>
                  </li>
                ))}
              </ol>
            ) : null}
          </Panel>

          <div className="flex justify-end">
            <ConfirmAction action={deleteQuote} hidden={{ id: q.id }} label="Delete this request" confirmLabel="Delete permanently" />
          </div>
        </div>
      </div>
    </>
  );
}
