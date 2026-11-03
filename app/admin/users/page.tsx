import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { Badge, EmptyState, FilterBar, PageHeader, Pager, Panel, Table } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import { Download } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Users" };
const PER_PAGE = 30;

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requirePermission("users");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const role = sp.role === "admin" || sp.role === "user" ? sp.role : "";
  const status = sp.status === "active" || sp.status === "suspended" ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: SQL[] = [];
  if (q) where.push(or(ilike(schema.users.name, `%${q}%`), ilike(schema.users.email, `%${q}%`), ilike(schema.users.institution, `%${q}%`))!);
  if (role) where.push(eq(schema.users.role, role));
  if (status) where.push(eq(schema.users.status, status));
  const cond = where.length ? and(...where) : undefined;

  const [rows, [{ n }]] = await Promise.all([
    db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        status: schema.users.status,
        country: schema.users.country,
        verified: schema.users.emailVerifiedAt,
        createdAt: schema.users.createdAt,
        lastLoginAt: schema.users.lastLoginAt,
        webinars: sql<number>`(select count(*)::int from webinar_registrations r where r.user_id = "users"."id")`,
        courses: sql<number>`(select count(*)::int from enrollments e where e.user_id = "users"."id")`,
        subscribed: sql<boolean>`exists(select 1 from email_subscriptions s where s.email = "users"."email" and s.status = 'subscribed')`,
      })
      .from(schema.users)
      .where(cond)
      .orderBy(desc(schema.users.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ n: count() }).from(schema.users).where(cond),
  ]);

  const link = (over: Record<string, string | number>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, role, status, page: 1, ...over })) if (v && !(k === "page" && v === 1)) p.set(k, String(v));
    return `/admin/users${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Users"
        description={`${n} account${n === 1 ? "" : "s"}. One account covers webinars and courses. Marketing consent is tracked separately.`}
        actions={
           
          <a href="/api/admin/export/users" download className="btn btn-ghost btn-sm">
            <Download size={16} /> Export CSV
          </a>
        }
      />
      <Panel pad={false}>
        <FilterBar>
          <label className="flex-1 sm:min-w-56">
            <span className="field-label">Search</span>
            <input suppressHydrationWarning name="q" defaultValue={q} placeholder="Name, email or institution" className="field" />
          </label>
          <label className="sm:w-40">
            <span className="field-label">Role</span>
            <select suppressHydrationWarning name="role" defaultValue={role} className="field">
              <option value="">All roles</option>
              <option value="user">Learners</option>
              <option value="admin">Admins</option>
            </select>
          </label>
          <label className="sm:w-40">
            <span className="field-label">Status</span>
            <select suppressHydrationWarning name="status" defaultValue={status} className="field">
              <option value="">Any</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <button suppressHydrationWarning className="btn btn-dark">Filter</button>
        </FilterBar>
        {rows.length ? (
          <Table head={["Person", "Activity", "Emails", "Joined", "Status"]}>
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-mist">
                <td>
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mist text-sm font-semibold">{u.name.slice(0, 1).toUpperCase()}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink hover:text-blue">
                        {u.name} {u.role === "admin" ? <Badge value="admin" /> : null}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {u.email}
                        {!u.verified ? " · not verified" : ""}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="whitespace-nowrap text-muted">
                  {u.webinars} webinar{u.webinars === 1 ? "" : "s"} · {u.courses} course{u.courses === 1 ? "" : "s"}
                </td>
                <td>{u.subscribed ? <Badge value="subscribed" /> : <span className="text-xs text-muted">Not opted in</span>}</td>
                <td className="whitespace-nowrap text-muted">{formatDate(u.createdAt, true)}</td>
                <td>
                  <Badge value={u.status} />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState title="No users found" text="People appear here when they create an account, for example to register for a webinar." />
          </div>
        )}
        <Pager page={page} pages={Math.ceil(n / PER_PAGE)} href={(p) => link({ page: p })} />
      </Panel>
    </>
  );
}
