import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { EmptyState, PageHeader, Panel, Table } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/utils";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Activity log" };

export default async function ActivityPage() {
  await requirePermission("activity");
  const rows = await db
    .select({ id: schema.auditLogs.id, action: schema.auditLogs.action, entity: schema.auditLogs.entity, createdAt: schema.auditLogs.createdAt, actor: schema.users.name })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorId))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(200);
  return (
    <>
      <PageHeader title="Activity log" description="The last 200 admin actions: who changed what, and when. Useful when several people manage the site." />
      <Panel pad={false}>
        {rows.length ? (
          <Table head={["When", "Who", "Action", "Item"]}>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap text-muted">{formatDateTime(r.createdAt)}</td>
                <td className="font-medium">{r.actor ?? "System"}</td>
                <td className="capitalize">{r.action.replace(/_/g, " ")}</td>
                <td className="capitalize text-muted">{r.entity.replace(/_/g, " ")}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState title="Nothing yet" text="Admin actions will be recorded here." />
          </div>
        )}
      </Panel>
    </>
  );
}
