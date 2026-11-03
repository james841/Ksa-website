import type { Metadata } from "next";
import { alias } from "drizzle-orm/pg-core";
import { asc, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { assignableRoles, ROLE_INFO, STAFF_ROLES, SECTION_LABELS, type StaffRole } from "@/lib/auth/permissions";
import { changeStaffRole, inviteStaff, removeStaff, resendInvite, revokeInvite } from "@/app/actions/admin/team";
import { ActionButton, AdminForm, ConfirmAction } from "@/components/admin/forms";
import { Badge, EmptyState, PageHeader, Panel, Table } from "@/components/admin/ui";
import { SubmitButton } from "@/components/forms/fields";
import { formatDate } from "@/lib/utils";
import { now } from "@/lib/now";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Team and access" };

export default async function TeamPage() {
  const me = await requirePermission("team");
  const inviter = alias(schema.users, "inviter");
  const [staff, invites] = await Promise.all([
    db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, staffRole: schema.users.staffRole, status: schema.users.status, lastLoginAt: schema.users.lastLoginAt, notifyByEmail: schema.users.notifyByEmail })
      .from(schema.users)
      .where(eq(schema.users.role, "admin"))
      .orderBy(asc(schema.users.name)),
    db
      .select({ id: schema.staffInvites.id, email: schema.staffInvites.email, staffRole: schema.staffInvites.staffRole, expiresAt: schema.staffInvites.expiresAt, createdAt: schema.staffInvites.createdAt, inviter: inviter.name })
      .from(schema.staffInvites)
      .leftJoin(inviter, eq(inviter.id, schema.staffInvites.invitedBy))
      .where(isNull(schema.staffInvites.acceptedAt))
      .orderBy(desc(schema.staffInvites.createdAt)),
  ]);
  const roles = assignableRoles(me.staffRole);
  const isSuper = me.staffRole === "super_admin";

  return (
    <>
      <PageHeader
        title="Team and access"
        description="Invite people to help run the website and choose what each person can open. Every page and action checks the role on the server."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Panel title="Team members" description={`${staff.length} ${staff.length === 1 ? "person has" : "people have"} admin access.`} pad={false}>
            <Table head={["Person", "Role", "Email alerts", "Last login", ""]}>
              {staff.map((u) => {
                const role = (u.staffRole ?? "super_admin") as StaffRole;
                const self = u.id === me.id;
                const locked = self || (role === "super_admin" && !isSuper);
                return (
                  <tr key={u.id} className="align-middle">
                    <td>
                      <span className="block font-medium text-ink">
                        {u.name} {self ? <span className="text-xs font-normal text-muted">(you)</span> : null}
                      </span>
                      <span className="block text-xs text-muted">{u.email}</span>
                      {u.status !== "active" ? <Badge value={u.status} /> : null}
                    </td>
                    <td>
                      {locked ? (
                        <Badge value={role} label={ROLE_INFO[role].label} />
                      ) : (
                        <AdminForm action={changeStaffRole} className="flex items-center gap-2" successTitle="Role updated">
                          <input suppressHydrationWarning type="hidden" name="id" value={u.id} />
                          <label className="sr-only" htmlFor={`role-${u.id}`}>
                            Role for {u.name}
                          </label>
                          <select suppressHydrationWarning id={`role-${u.id}`} name="role" defaultValue={role} className="field !w-auto !py-2 text-sm">
                            {roles.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_INFO[r].label}
                              </option>
                            ))}
                          </select>
                          <SubmitButton variant="ghost" className="btn-sm" pendingText="…">
                            Save
                          </SubmitButton>
                        </AdminForm>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-muted">{u.notifyByEmail ? "On" : "Off"}</td>
                    <td className="whitespace-nowrap text-muted">{u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "Never"}</td>
                    <td className="text-right">
                      {locked ? null : <ConfirmAction action={removeStaff} hidden={{ id: u.id }} label="Remove access" confirmLabel="Remove" success="Admin access removed" />}
                    </td>
                  </tr>
                );
              })}
            </Table>
          </Panel>

          <Panel title="Waiting to accept" description="Invites that have not been used yet. A new invite or Resend replaces the old link." pad={false}>
            {invites.length ? (
              <Table head={["Email", "Role", "Invited", ""]}>
                {invites.map((i) => {
                  const expired = i.expiresAt < now();
                  const mine = roles.includes(i.staffRole);
                  return (
                    <tr key={i.id}>
                      <td>
                        <span className="block font-medium text-ink">{i.email}</span>
                        <span className="block text-xs text-muted">{expired ? "Link expired" : `Link works until ${formatDate(i.expiresAt, true)}`}</span>
                      </td>
                      <td>
                        <Badge value={i.staffRole} label={ROLE_INFO[i.staffRole].label} />
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        {formatDate(i.createdAt, true)}
                        {i.inviter ? ` by ${i.inviter.split(" ")[0]}` : ""}
                      </td>
                      <td>
                        {mine ? (
                          <div className="flex justify-end gap-2">
                            <ActionButton action={resendInvite} hidden={{ id: i.id }} className="btn-sm" success="A new invite link has been emailed">
                              Resend
                            </ActionButton>
                            <ConfirmAction action={revokeInvite} hidden={{ id: i.id }} label="Cancel" confirmLabel="Cancel invite" success="Invite cancelled" />
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </Table>
            ) : (
              <div className="p-6">
                <EmptyState title="No open invites" text="Invite someone with the form on this page. They will get an email with a secure link." />
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Invite someone" description="They get an email with a link. They log in (or create an account) with that same email to accept.">
            <AdminForm action={inviteStaff} resetOnSuccess className="space-y-5" successTitle="Invite sent">
              <div>
                <label className="field-label" htmlFor="inv-email">
                  Email address
                </label>
                <input suppressHydrationWarning id="inv-email" name="email" type="email" required autoComplete="off" placeholder="name@example.com" className="field" />
              </div>
              <div>
                <label className="field-label" htmlFor="inv-role">
                  Role
                </label>
                <select suppressHydrationWarning id="inv-role" name="role" defaultValue="content_editor" className="field">
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_INFO[r].label}
                    </option>
                  ))}
                </select>
              </div>
              <SubmitButton pendingText="Sending…">Send invite</SubmitButton>
            </AdminForm>
          </Panel>

          <Panel title="What each role can open">
            <ul className="space-y-4">
              {STAFF_ROLES.map((r) => (
                <li key={r} className="rounded-xl border border-line p-4">
                  <p className="font-semibold text-ink">{ROLE_INFO[r].label}</p>
                  <p className="mt-1 text-sm text-muted">{ROLE_INFO[r].description}</p>
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {ROLE_INFO[r].sections
                      .filter((s) => s !== "overview")
                      .map((s) => (
                        <span key={s} className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-medium text-ink">
                          {SECTION_LABELS[s]}
                        </span>
                      ))}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              Each person is emailed only about their own sections, and can switch those emails off on their dashboard. A copy of every alert also goes to
              the general alerts address in Site settings.
            </p>
            <p className="mt-3 text-xs text-muted">
              Safety rules: you cannot change or remove yourself, only a super admin can manage super admins, and there is always at least one super admin.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
