import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { addLesson, addModule, deleteCourse, deleteModule, moveLesson, moveModule, updateModule } from "@/app/actions/admin/courses";
import { grantCourseAccessByEmail, revokeEnrollment } from "@/app/actions/admin/people";
import { ActionButton, AdminForm, ConfirmAction } from "@/components/admin/forms";
import { Badge, EmptyState, PageHeader, Panel, Table } from "@/components/admin/ui";
import { CourseForm } from "@/components/admin/course-form";
import { SubmitButton } from "@/components/forms/fields";
import { formatDate } from "@/lib/utils";
import { ChevronDown, Edit, Eye, Lock, Play } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Edit course" };

export default async function EditCourse({ params, searchParams }: PageProps<"/admin/courses/[id]">) {
  await requirePermission("courses");
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [c] = await db.select().from(schema.courses).where(eq(schema.courses.id, id)).limit(1);
  if (!c) notFound();

  const [modules, lessons, learners, [{ waiting }], payments] = await Promise.all([
    db.select().from(schema.courseModules).where(eq(schema.courseModules.courseId, id)).orderBy(asc(schema.courseModules.position)),
    db
      .select({
        id: schema.lessons.id,
        moduleId: schema.lessons.moduleId,
        title: schema.lessons.title,
        published: schema.lessons.published,
        isPreview: schema.lessons.isPreview,
        videoUrl: schema.lessons.videoUrl,
        durationMinutes: schema.lessons.durationMinutes,
      })
      .from(schema.lessons)
      .where(eq(schema.lessons.courseId, id))
      .orderBy(asc(schema.lessons.position)),
    db
      .select({
        id: schema.enrollments.id,
        userId: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        source: schema.enrollments.source,
        createdAt: schema.enrollments.createdAt,
        completedAt: schema.enrollments.completedAt,
        done: sql<number>`(select count(*)::int from lesson_progress p where p.user_id = "enrollments"."user_id" and p.course_id = "enrollments"."course_id")`,
      })
      .from(schema.enrollments)
      .innerJoin(schema.users, eq(schema.users.id, schema.enrollments.userId))
      .where(eq(schema.enrollments.courseId, id))
      .orderBy(desc(schema.enrollments.createdAt)),
    db.select({ waiting: sql<number>`count(*)::int` }).from(schema.courseInterest).where(eq(schema.courseInterest.courseId, id)),
    db
      .select({
        id: schema.payments.id,
        reference: schema.payments.reference,
        status: schema.payments.status,
        amountCents: schema.payments.amountCents,
        currency: schema.payments.currency,
        createdAt: schema.payments.createdAt,
        paidAt: schema.payments.paidAt,
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.payments)
      .innerJoin(schema.users, eq(schema.users.id, schema.payments.userId))
      .where(eq(schema.payments.courseId, id))
      .orderBy(desc(schema.payments.createdAt))
      .limit(20),
  ]);
  const publishedLessons = lessons.filter((l) => l.published).length;
  const money = (cents: number, currency: string) => new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(cents / 100);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/courses", label: "Courses" }}
        title={c.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge value={c.status} /> <Badge value={c.enrollmentMode} label={c.enrollmentMode === "open" ? "Open enrolment" : "Invite only"} /> {lessons.length} lesson{lessons.length === 1 ? "" : "s"} · {learners.length} learner{learners.length === 1 ? "" : "s"}
            {c.status === "coming_soon" ? ` · ${waiting} waiting to be notified` : ""}
          </span>
        }
        actions={
          c.status === "published" || c.status === "coming_soon" ? (
            <Link href={`/courses/${c.slug}`} target="_blank" className="btn btn-ghost btn-sm">
              <Eye size={16} /> View course page
            </Link>
          ) : null
        }
      />
      {sp.created ? (
        <p role="status" className="mb-6 rounded-xl bg-[#e8f5ee] px-4 py-3 text-sm font-medium text-success">
          Course created. Now add modules and lessons in the curriculum below.
        </p>
      ) : null}
      {c.status === "published" && publishedLessons === 0 ? (
        <p role="alert" className="mb-6 rounded-xl bg-[#fff3d6] px-4 py-3 text-sm font-medium text-[#7a5300]">
          This course is published but has no visible lessons yet. Learners will see an empty course.
        </p>
      ) : null}

      <CourseForm course={c} />

      <Panel title="Curriculum" description="Modules group your lessons. Use the arrows to change the order learners see." className="mt-8">
        {modules.length ? (
          <ol className="space-y-4">
            {modules.map((m, mi) => {
              const ml = lessons.filter((l) => l.moduleId === m.id);
              return (
                <li key={m.id} className="overflow-hidden rounded-2xl border border-line">
                  <div className="flex flex-wrap items-center gap-3 bg-mist px-4 py-3">
                    <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-bold text-white">{mi + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{m.title}</p>
                      {m.summary ? <p className="truncate text-xs text-muted">{m.summary}</p> : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <ActionButton action={moveModule} hidden={{ id: m.id, dir: "up" }} className="px-2.5" variant="ghost" success="Order updated">
                        ↑
                      </ActionButton>
                      <ActionButton action={moveModule} hidden={{ id: m.id, dir: "down" }} className="px-2.5" variant="ghost" success="Order updated">
                        ↓
                      </ActionButton>
                      <ConfirmAction action={deleteModule} hidden={{ id: m.id }} label="Delete" confirmLabel={`Delete module and ${ml.length} lessons`} success="Module deleted" />
                    </div>
                  </div>
                  <details className="group border-b border-line px-4 py-2 text-sm">
                    <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
                      <Edit size={14} /> Rename module <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                    </summary>
                    <AdminForm action={updateModule} successTitle="Module saved" className="mt-3 grid gap-3 pb-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:space-y-0">
                      <input suppressHydrationWarning type="hidden" name="id" value={m.id} />
                      <input suppressHydrationWarning name="title" defaultValue={m.title} required className="field" aria-label="Module title" />
                      <input suppressHydrationWarning name="summary" defaultValue={m.summary ?? ""} placeholder="Short summary (optional)" className="field" aria-label="Module summary" />
                      <SubmitButton variant="dark" className="btn-sm">
                        Save
                      </SubmitButton>
                    </AdminForm>
                  </details>
                  {ml.length ? (
                    <ul className="divide-y divide-line">
                      {ml.map((l, li) => (
                        <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                          <span className="w-6 text-xs text-muted">
                            {mi + 1}.{li + 1}
                          </span>
                          <span className="text-muted">{l.videoUrl ? <Play size={16} /> : <Lock size={16} className="opacity-0" />}</span>
                          <Link href={`/admin/courses/${c.id}/lessons/${l.id}`} className="min-w-0 flex-1 font-medium hover:text-blue">
                            {l.title}
                            {l.durationMinutes ? <span className="ml-2 text-xs font-normal text-muted">{l.durationMinutes} min</span> : null}
                          </Link>
                          {l.isPreview ? <Badge value="coming_soon" label="Free preview" /> : null}
                          {!l.published ? <Badge value="draft" label="Hidden" /> : null}
                          <span className="flex gap-1">
                            <ActionButton action={moveLesson} hidden={{ id: l.id, dir: "up" }} className="px-2.5" success="Order updated">
                              ↑
                            </ActionButton>
                            <ActionButton action={moveLesson} hidden={{ id: l.id, dir: "down" }} className="px-2.5" success="Order updated">
                              ↓
                            </ActionButton>
                            <Link href={`/admin/courses/${c.id}/lessons/${l.id}`} className="btn btn-ghost btn-sm">
                              Edit
                            </Link>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <AdminForm action={addLesson} className="flex flex-col gap-2 border-t border-dashed border-line bg-white px-4 py-3 sm:flex-row sm:items-center sm:space-y-0" successTitle="Lesson added">
                    <input suppressHydrationWarning type="hidden" name="moduleId" value={m.id} />
                    <input suppressHydrationWarning name="title" required placeholder="New lesson title" className="field py-2 sm:flex-1" aria-label="New lesson title" />
                    <SubmitButton variant="ghost" className="btn-sm">
                      + Add lesson
                    </SubmitButton>
                  </AdminForm>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState title="No modules yet" text="Start with a module such as “Getting started”, then add lessons to it." />
        )}

        <AdminForm action={addModule} resetOnSuccess successTitle="Module added" className="mt-6 grid gap-3 rounded-2xl bg-mist p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:space-y-0">
          <input suppressHydrationWarning type="hidden" name="courseId" value={c.id} />
          <label>
            <span className="field-label">New module</span>
            <input suppressHydrationWarning name="title" required placeholder="e.g. Module 1: Finding your focus" className="field" />
          </label>
          <label>
            <span className="field-label">Summary (optional)</span>
            <input suppressHydrationWarning name="summary" className="field" />
          </label>
          <SubmitButton variant="dark">Add module</SubmitButton>
        </AdminForm>
      </Panel>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title={`Learners (${learners.length})`} pad={false}>
          {learners.length ? (
            <Table head={["Learner", "Progress", "Access", ""]}>
              {learners.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link href={`/admin/users/${l.userId}`} className="font-medium hover:text-blue">
                      {l.name}
                    </Link>
                    <span className="block text-xs text-muted">{l.email}</span>
                  </td>
                  <td className="min-w-40">
                    {l.completedAt ? (
                      <Badge value="published" label="Completed" />
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-mist">
                          <span className="block h-full rounded-full bg-blue" style={{ width: `${publishedLessons ? Math.min(100, (l.done / publishedLessons) * 100) : 0}%` }} />
                        </span>
                        <span className="text-xs text-muted">
                          {l.done}/{publishedLessons}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-xs text-muted">
                    {l.source === "admin" ? "Granted" : "Self"} · {formatDate(l.createdAt, true)}
                  </td>
                  <td className="text-right">
                    <ConfirmAction action={revokeEnrollment} hidden={{ id: l.id }} label="Remove" confirmLabel="Remove access" success="Access removed" />
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="p-6">
              <EmptyState title="No learners yet" text={c.enrollmentMode === "open" && c.status === "published" ? "Signed-in visitors can enrol from the course page." : "Give people access with the form on the right."} />
            </div>
          )}
        </Panel>
        <div className="space-y-6">
          {c.priceCents > 0 ? (
            <Panel
              title="Payments"
              description={`${money(c.priceCents, c.currency)} per place. Paid through PayFast; access is given automatically once PayFast confirms.`}
              pad={false}
            >
              {payments.length ? (
                <ul className="divide-y divide-line">
                  {payments.map((pay) => (
                    <li key={pay.id} className="flex items-center gap-3 px-6 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{pay.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {pay.reference} · {formatDate(pay.paidAt ?? pay.createdAt, true)}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-sm font-semibold text-ink">{money(pay.amountCents, pay.currency)}</span>
                      <Badge value={pay.status === "paid" ? "published" : pay.status === "pending" ? "draft" : "cancelled"} label={pay.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6">
                  <EmptyState title="No payments yet" text="Payments appear here as soon as someone buys a place." />
                </div>
              )}
            </Panel>
          ) : null}
          <Panel title="Give people access" description="Paste one or more emails of people who already have an account.">
            <AdminForm action={grantCourseAccessByEmail} resetOnSuccess successTitle="Access granted">
              <input suppressHydrationWarning type="hidden" name="courseId" value={c.id} />
              <textarea suppressHydrationWarning name="emails" required placeholder={"ada@example.com\ntunde@example.com"} className="field min-h-28" aria-label="Email addresses" />
              <SubmitButton variant="dark">Grant access</SubmitButton>
            </AdminForm>
          </Panel>
          <Panel title="Danger zone">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">Deletes the course, its lessons, files and learner progress.</p>
              <ConfirmAction action={deleteCourse} hidden={{ id: c.id }} label="Delete course" confirmLabel="Delete permanently" />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
