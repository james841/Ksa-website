import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, gte, lt, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { Badge, EmptyState, PageHeader, Panel, Table } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/utils";
import { Plus } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Webinars" };

const cols = {
  id: schema.webinars.id,
  title: schema.webinars.title,
  slug: schema.webinars.slug,
  startsAt: schema.webinars.startsAt,
  status: schema.webinars.status,
  capacity: schema.webinars.capacity,
  meetingUrl: schema.webinars.meetingUrl,
  registered: sql<number>`(select count(*)::int from webinar_registrations r where r.webinar_id = "webinars"."id")`,
  attended: sql<number>`(select count(*)::int from webinar_registrations r where r.webinar_id = "webinars"."id" and r.attended)`,
};

export default async function WebinarsAdmin() {
  await requirePermission("webinars");
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db.select(cols).from(schema.webinars).where(gte(schema.webinars.startsAt, now)).orderBy(asc(schema.webinars.startsAt)),
    db.select(cols).from(schema.webinars).where(lt(schema.webinars.startsAt, now)).orderBy(desc(schema.webinars.startsAt)).limit(50),
  ]);

  const table = (rows: typeof upcoming, isPast: boolean) => (
    <Table head={["Webinar", "Date", isPast ? "Attended" : "Registered", "Status"]}>
      {rows.map((w) => (
        <tr key={w.id} className="hover:bg-mist">
          <td>
            <Link href={`/admin/webinars/${w.id}`} className="font-medium text-ink hover:text-blue">
              {w.title}
            </Link>
            {!isPast && !w.meetingUrl && w.status === "published" ? <span className="block text-xs font-semibold text-danger">Zoom link missing</span> : null}
          </td>
          <td className="whitespace-nowrap text-muted">{formatDateTime(w.startsAt)}</td>
          <td className="whitespace-nowrap">
            {isPast ? `${w.attended} of ${w.registered}` : w.registered}
            {!isPast && w.capacity ? <span className="text-muted"> / {w.capacity}</span> : null}
          </td>
          <td>
            <Badge value={w.status} />
          </td>
        </tr>
      ))}
    </Table>
  );

  return (
    <>
      <PageHeader
        title="Webinars"
        description="Create sessions, publish them for registration, add the Zoom link and email the people who signed up."
        actions={
          <Link href="/admin/webinars/new" className="btn btn-primary btn-sm">
            <Plus size={16} /> New webinar
          </Link>
        }
      />
      <div className="space-y-6">
        <Panel title="Upcoming" pad={false}>
          {upcoming.length ? (
            table(upcoming, false)
          ) : (
            <div className="p-6">
              <EmptyState
                title="No upcoming webinars"
                text="While none are scheduled, the website invites visitors to subscribe for announcements."
                action={
                  <Link href="/admin/webinars/new" className="btn btn-dark btn-sm">
                    Schedule a webinar
                  </Link>
                }
              />
            </div>
          )}
        </Panel>
        {past.length ? (
          <Panel title="Past" pad={false}>
            {table(past, true)}
          </Panel>
        ) : null}
      </div>
    </>
  );
}
