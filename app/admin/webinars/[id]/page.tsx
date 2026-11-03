import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { cancelWebinar, deleteWebinar, emailAttendees, removeRegistration, toggleAttended } from "@/app/actions/admin/webinars";
import { ActionButton, AdminForm, ConfirmAction, MarkdownHint } from "@/components/admin/forms";
import { Badge, EmptyState, PageHeader, Panel, Table } from "@/components/admin/ui";
import { WebinarForm } from "@/components/admin/webinar-form";
import { SubmitButton } from "@/components/forms/fields";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Download, Eye } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Edit webinar" };

export default async function EditWebinar({ params, searchParams }: PageProps<"/admin/webinars/[id]">) {
  await requirePermission("webinars");
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [w] = await db.select().from(schema.webinars).where(eq(schema.webinars.id, id)).limit(1);
  if (!w) notFound();
  const attendees = await db
    .select({
      id: schema.webinarRegistrations.id,
      attended: schema.webinarRegistrations.attended,
      createdAt: schema.webinarRegistrations.createdAt,
      userId: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      country: schema.users.country,
      institution: schema.users.institution,
    })
    .from(schema.webinarRegistrations)
    .innerJoin(schema.users, eq(schema.users.id, schema.webinarRegistrations.userId))
    .where(eq(schema.webinarRegistrations.webinarId, id))
    .orderBy(asc(schema.webinarRegistrations.createdAt));
  const isPast = w.startsAt < new Date();

  return (
    <>
      <PageHeader
        back={{ href: "/admin/webinars", label: "Webinars" }}
        title={w.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge value={w.status} /> {formatDateTime(w.startsAt)} · {attendees.length} registered
          </span>
        }
        actions={
          w.status !== "draft" ? (
            <Link href={`/webinars/${w.slug}`} target="_blank" className="btn btn-ghost btn-sm">
              <Eye size={16} /> View public page
            </Link>
          ) : null
        }
      />
      {sp.created ? (
        <p role="status" className="mb-6 rounded-xl bg-[#e8f5ee] px-4 py-3 text-sm font-medium text-success">
          Webinar created.{w.status === "draft" ? " It is a draft: set the status to Published when you want people to register." : ""}
        </p>
      ) : null}

      <WebinarForm webinar={w} />

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title={`Registered (${attendees.length}${w.capacity ? ` of ${w.capacity}` : ""})`}
          description={isPast ? "Tick who attended to keep a record." : "People who registered while signed in to their account."}
          pad={false}
          actions={
            attendees.length ? (
              <a href={`/api/admin/export/attendees?webinar=${w.id}`} className="btn btn-ghost btn-sm">
                <Download size={16} /> CSV
              </a>
            ) : null
          }
        >
          {attendees.length ? (
            <Table head={["Name", "Institution", "Registered", "Attended", ""]}>
              {attendees.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/users/${a.userId}`} className="font-medium hover:text-blue">
                      {a.name}
                    </Link>
                    <span className="block text-xs text-muted">{a.email}</span>
                  </td>
                  <td className="text-muted">{[a.institution, a.country].filter(Boolean).join(", ") || "–"}</td>
                  <td className="whitespace-nowrap text-muted">{formatDate(a.createdAt, true)}</td>
                  <td>
                    <ActionButton action={toggleAttended} hidden={{ id: a.id, attended: a.attended ? "0" : "1" }} variant={a.attended ? "dark" : "ghost"} success="Attendance updated">
                      {a.attended ? "Yes" : "Mark"}
                    </ActionButton>
                  </td>
                  <td className="text-right">
                    <ConfirmAction action={removeRegistration} hidden={{ id: a.id }} label="Remove" confirmLabel="Remove" success="Registration removed" />
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="p-6">
              <EmptyState title="No registrations yet" text={w.status === "published" ? "Share the webinar page link. People create a free account to register." : "Publish the webinar to open registration."} />
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Email everyone registered" description="For reminders, the joining link or a recording. Account emails do not need marketing consent.">
            <AdminForm action={emailAttendees} resetOnSuccess successTitle="Email sent to attendees">
              <input suppressHydrationWarning type="hidden" name="id" value={w.id} />
              <div>
                <label className="field-label" htmlFor="ea-s">
                  Subject
                </label>
                <input suppressHydrationWarning id="ea-s" name="subject" required className="field" defaultValue={`Reminder: ${w.title}`} />
              </div>
              <div>
                <label className="field-label" htmlFor="ea-b">
                  Message
                </label>
                <textarea suppressHydrationWarning
                  id="ea-b"
                  name="body"
                  required
                  className="field min-h-40 font-mono text-sm"
                  defaultValue={`Hello {{first_name}},\n\nThis is a reminder that **${w.title}** starts on ${formatDateTime(w.startsAt)}.\n\n${w.meetingUrl ? `Join here: ${w.meetingUrl}` : "Join here: (add the link)"}\n\nSee you there,\nKnowledge Space Academy`}
                />
                <p className="mt-1.5 text-xs text-muted">
                  <code>{"{{first_name}}"}</code> is replaced for each person. <MarkdownHint />
                </p>
              </div>
              <SubmitButton variant="dark" pendingText="Queuing…">
                Send to {attendees.length} {attendees.length === 1 ? "person" : "people"}
              </SubmitButton>
            </AdminForm>
          </Panel>

          <Panel title="Danger zone">
            <div className="space-y-4">
              {w.status !== "cancelled" ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Cancel and notify</p>
                    <p className="text-xs text-muted">Marks it cancelled and emails everyone registered.</p>
                  </div>
                  <ConfirmAction action={cancelWebinar} hidden={{ id: w.id, notify: "1" }} label="Cancel webinar" confirmLabel="Cancel and email" success="Webinar cancelled" />
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <div>
                  <p className="font-medium">Delete</p>
                  <p className="text-xs text-muted">Removes the webinar and its registration list for good.</p>
                </div>
                <ConfirmAction action={deleteWebinar} hidden={{ id: w.id }} label="Delete" confirmLabel="Delete permanently" />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
