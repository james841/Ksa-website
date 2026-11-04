import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, notInArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { grantCourseAccess, revokeEnrollment, setUserStatus } from "@/app/actions/admin/people";
import { AdminForm, ConfirmAction } from "@/components/admin/forms";
import { Badge, DefinitionList, PageHeader, Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/forms/fields";
import { formatDate, formatDateTime } from "@/lib/utils";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "User" };

export default async function UserDetail({ params }: PageProps<"/admin/users/[id]">) {
  const admin = await requirePermission("users");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!u) notFound();

  const [webinars, courses, [sub], quotes] = await Promise.all([
    db
      .select({ id: schema.webinars.id, title: schema.webinars.title, startsAt: schema.webinars.startsAt, attended: schema.webinarRegistrations.attended, registeredAt: schema.webinarRegistrations.createdAt })
      .from(schema.webinarRegistrations)
      .innerJoin(schema.webinars, eq(schema.webinars.id, schema.webinarRegistrations.webinarId))
      .where(eq(schema.webinarRegistrations.userId, id))
      .orderBy(desc(schema.webinars.startsAt)),
    db
      .select({
        enrollmentId: schema.enrollments.id,
        courseId: schema.courses.id,
        title: schema.courses.title,
        source: schema.enrollments.source,
        createdAt: schema.enrollments.createdAt,
        completedAt: schema.enrollments.completedAt,
      })
      .from(schema.enrollments)
      .innerJoin(schema.courses, eq(schema.courses.id, schema.enrollments.courseId))
      .where(eq(schema.enrollments.userId, id)),
    db.select().from(schema.emailSubscriptions).where(eq(schema.emailSubscriptions.email, u.email)).limit(1),
    db
      .select({ id: schema.quoteRequests.id, reference: schema.quoteRequests.reference, service: schema.quoteRequests.service, status: schema.quoteRequests.status })
      .from(schema.quoteRequests)
      .where(eq(schema.quoteRequests.email, u.email)),
  ]);
  const consentEvents = sub
    ? await db.select().from(schema.consentEvents).where(eq(schema.consentEvents.subscriptionId, sub.id)).orderBy(desc(schema.consentEvents.createdAt))
    : [];
  const otherCourses = await db
    .select({ id: schema.courses.id, title: schema.courses.title, status: schema.courses.status })
    .from(schema.courses)
    .where(courses.length ? notInArray(schema.courses.id, courses.map((c) => c.courseId)) : undefined)
    .orderBy(asc(schema.courses.title));
  const isSelf = admin.id === u.id;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/users", label: "All users" }}
        title={u.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge value={u.role} /> <Badge value={u.status} /> {u.email}
          </span>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Profile">
            <DefinitionList
              items={[
                ["Email", u.email],
                ["Email verified", u.emailVerifiedAt ? formatDateTime(u.emailVerifiedAt) : "Not yet"],
                ["Country", u.country],
                ["Institution", u.institution],
                ["Phone", u.phone],
                ["Registered", formatDateTime(u.createdAt)],
                ["Last sign-in", u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"],
              ]}
            />
          </Panel>

          <Panel title={`Webinars (${webinars.length})`}>
            {webinars.length ? (
              <ul className="divide-y divide-line">
                {webinars.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-3 py-3">
                    <Link href={`/admin/webinars/${w.id}`} className="font-medium hover:text-blue">
                      {w.title}
                      <span className="block text-xs font-normal text-muted">{formatDateTime(w.startsAt)}</span>
                    </Link>
                    {w.attended ? <Badge value="published" label="Attended" /> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Not registered for any webinar.</p>
            )}
          </Panel>

          <Panel title={`Courses (${courses.length})`}>
            {courses.length ? (
              <ul className="divide-y divide-line">
                {courses.map((c) => (
                  <li key={c.enrollmentId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <Link href={`/admin/courses/${c.courseId}`} className="font-medium hover:text-blue">
                      {c.title}
                      <span className="block text-xs font-normal text-muted">
                        {c.source === "admin" ? "Given access by an admin" : "Enrolled themselves"} · {formatDate(c.createdAt, true)}
                        {c.completedAt ? ` · completed ${formatDate(c.completedAt, true)}` : ""}
                      </span>
                    </Link>
                    <ConfirmAction action={revokeEnrollment} hidden={{ id: c.enrollmentId }} label="Remove access" confirmLabel="Remove" success="Access removed" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No course access yet.</p>
            )}
            {otherCourses.length ? (
              <AdminForm action={grantCourseAccess} className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-end sm:space-y-0" successTitle="Access granted">
                <input suppressHydrationWarning type="hidden" name="userId" value={u.id} />
                <label className="flex-1">
                  <span className="field-label">Give access to a course</span>
                  <select suppressHydrationWarning name="courseId" className="field" defaultValue="">
                    <option value="">Choose a course…</option>
                    {otherCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} {c.status !== "published" ? `(${c.status.replace("_", " ")})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <SubmitButton variant="dark">Grant access</SubmitButton>
              </AdminForm>
            ) : null}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Marketing emails" description="Separate from the account. Only opted-in people receive campaigns.">
            {sub ? (
              <>
                <p className="flex items-center gap-2">
                  <Badge value={sub.status} />
                  <span className="text-sm text-muted">since {formatDate(sub.status === "subscribed" ? sub.consentedAt : sub.unsubscribedAt)}</span>
                </p>
                <p className="mt-3 text-xs text-muted">
                  Source: {sub.source}. Wording agreed to: “{sub.consentText}”
                </p>
                {consentEvents.length ? (
                  <ol className="mt-4 space-y-1.5 border-l-2 border-line pl-3 text-xs text-muted">
                    {consentEvents.map((e) => (
                      <li key={e.id}>
                        <strong className="capitalize text-ink">{e.action}</strong> · {formatDateTime(e.createdAt)}
                        {e.source ? ` · ${e.source}` : ""}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted">Has not opted in to marketing emails. They still receive account and webinar emails.</p>
            )}
          </Panel>

          {quotes.length ? (
            <Panel title="Service requests">
              <ul className="space-y-2">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link href={`/admin/quotes/${q.id}`} className="flex items-center justify-between gap-2 text-sm hover:text-blue">
                      <span>
                        {q.reference} · {q.service}
                      </span>
                      <Badge value={q.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Account controls">
            {isSelf ? (
              <p className="text-sm text-muted">This is your own account. Another team member must change your role or status.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{u.status === "active" ? "Suspend account" : "Reactivate account"}</p>
                    <p className="text-xs text-muted">{u.status === "active" ? "Signs them out and blocks sign-in." : "Lets them sign in again."}</p>
                  </div>
                  <ConfirmAction
                    action={setUserStatus}
                    hidden={{ id: u.id, status: u.status === "active" ? "suspended" : "active" }}
                    label={u.status === "active" ? "Suspend" : "Reactivate"}
                    confirmLabel="Confirm"
                    tone={u.status === "active" ? "danger" : "dark"} success="Account updated"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
                  <div>
                    <p className="font-medium">{u.role === "admin" ? "Admin team member" : "Admin access"}</p>
                    <p className="text-xs text-muted">{u.role === "admin" ? "Change their role or remove access on the Team page." : "Invite them by email on the Team page and choose a role."}</p>
                  </div>
                  <Link href="/admin/team" className="btn btn-sm btn-ghost">
                    Team page
                  </Link>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
