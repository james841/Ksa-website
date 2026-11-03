"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, isNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { audit } from "@/lib/audit";
import { randomToken, sha256 } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/session";
import { findOpenInvite } from "@/lib/auth/invites";
import { assignableRoles, isStaffRole, ROLE_INFO, type StaffRole } from "@/lib/auth/permissions";
import { sendStaffInvite } from "@/lib/email/templates";
import { notifyTeam } from "@/lib/notify";
import { requireAdmin } from "@/lib/auth/session";
import type { ActionState } from "@/lib/validation";
import { errMsg, guard, str } from "./helpers";

const INVITE_DAYS = 7;

/* A user's effective staff role (older admin accounts with no role are super admins). */
const effective = (u: { role: "user" | "admin"; staffRole: StaffRole | null }) => (u.role === "admin" ? (u.staffRole ?? "super_admin") : null);

/** Counts super admins other than `exceptId`, so the last one can never be removed or demoted. */
async function otherSuperAdmins(exceptId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.role, "admin"),
        eq(schema.users.status, "active"),
        or(eq(schema.users.staffRole, "super_admin"), isNull(schema.users.staffRole)),
        ne(schema.users.id, exceptId),
      ),
    );
  return n;
}

/** Invite someone to the admin team by email. They get a link that is valid for 7 days. */
export async function inviteStaff(_p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await guard("team");
  const email = str(fd, "email").toLowerCase();
  const role = str(fd, "role");
  if (!z.string().email().safeParse(email).success) return { ok: false, message: "Please enter a valid email address." };
  if (!isStaffRole(role) || !assignableRoles(actor.staffRole).includes(role)) return { ok: false, message: "Please choose a role you are allowed to give." };

  try {
    const [existing] = await db
      .select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where(sql`lower(${schema.users.email}) = ${email}`)
      .limit(1);
    if (existing?.role === "admin") return { ok: false, message: "That person is already on the team. Change their role in the list below." };

    // One open invite per email: a new invite replaces the old link.
    await db.delete(schema.staffInvites).where(and(eq(schema.staffInvites.email, email), isNull(schema.staffInvites.acceptedAt)));
    const token = randomToken(32);
    const [invite] = await db
      .insert(schema.staffInvites)
      .values({ email, staffRole: role, tokenHash: sha256(token), invitedBy: actor.id, expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000) })
      .returning({ id: schema.staffInvites.id });
    const sent = await sendStaffInvite(email, { inviter: actor.name, role: ROLE_INFO[role].label, token, hasAccount: !!existing });
    await audit(actor.id, "invite", "staff", invite.id, { email, role });
    refresh();
    if (sent.error) return { ok: false, message: `The invite was saved, but the email could not be sent (${sent.error}). Press "Resend" in the list below to try again.` };
    return { ok: true, message: `Invite sent to ${email}. The link works for ${INVITE_DAYS} days.` };
  } catch (e) {
    return { ok: false, message: errMsg(e) };
  }
}

/** Sends a fresh link for an open invite (the old link stops working). */
export async function resendInvite(fd: FormData) {
  const actor = await guard("team");
  const id = str(fd, "id");
  const [inv] = await db.select().from(schema.staffInvites).where(and(eq(schema.staffInvites.id, id), isNull(schema.staffInvites.acceptedAt))).limit(1);
  if (!inv) return;
  if (!assignableRoles(actor.staffRole).includes(inv.staffRole)) return;
  const token = randomToken(32);
  await db
    .update(schema.staffInvites)
    .set({ tokenHash: sha256(token), expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000) })
    .where(eq(schema.staffInvites.id, id));
  const [u] = await db.select({ id: schema.users.id }).from(schema.users).where(sql`lower(${schema.users.email}) = ${inv.email}`).limit(1);
  await sendStaffInvite(inv.email, { inviter: actor.name, role: ROLE_INFO[inv.staffRole].label, token, hasAccount: !!u });
  await audit(actor.id, "resend_invite", "staff", id);
  refresh();
}

export async function revokeInvite(fd: FormData) {
  const actor = await guard("team");
  const id = str(fd, "id");
  const [inv] = await db.select({ staffRole: schema.staffInvites.staffRole }).from(schema.staffInvites).where(eq(schema.staffInvites.id, id)).limit(1);
  if (!inv || !assignableRoles(actor.staffRole).includes(inv.staffRole)) return;
  await db.delete(schema.staffInvites).where(and(eq(schema.staffInvites.id, id), isNull(schema.staffInvites.acceptedAt)));
  await audit(actor.id, "revoke_invite", "staff", id);
  refresh();
}

/** Change a team member's role. You cannot change your own role, and only super admins manage super admins. */
export async function changeStaffRole(_p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await guard("team");
  const id = str(fd, "id");
  const role = str(fd, "role");
  if (id === actor.id) return { ok: false, message: "You cannot change your own role. Ask another super admin." };
  if (!isStaffRole(role) || !assignableRoles(actor.staffRole).includes(role)) return { ok: false, message: "You cannot give that role." };
  const [target] = await db.select({ role: schema.users.role, staffRole: schema.users.staffRole }).from(schema.users).where(eq(schema.users.id, id)).limit(1);
  const current = target && effective(target);
  if (!current) return { ok: false, message: "That person is not on the team." };
  if (current === "super_admin" && actor.staffRole !== "super_admin") return { ok: false, message: "Only a super admin can change another super admin." };
  if (current === "super_admin" && role !== "super_admin" && (await otherSuperAdmins(id)) === 0) return { ok: false, message: "There must always be at least one super admin." };
  await db.update(schema.users).set({ staffRole: role }).where(eq(schema.users.id, id));
  await audit(actor.id, "change_role", "staff", id, { from: current, to: role });
  const [who] = await db.select({ name: schema.users.name, email: schema.users.email }).from(schema.users).where(eq(schema.users.id, id)).limit(1);
  await notifyTeam({
    event: "team",
    subject: "Admin role changed",
    headline: `${who?.name ?? "A team member"} is now ${ROLE_INFO[role].label}`,
    rows: [
      ["Person", `${who?.name ?? ""} (${who?.email ?? ""})`],
      ["Previous role", ROLE_INFO[current].label],
      ["New role", ROLE_INFO[role].label],
      ["Changed by", actor.name],
    ],
    link: "/admin/team",
    linkLabel: "Open the team page",
  });
  refresh();
  return { ok: true, message: `Role changed to ${ROLE_INFO[role].label}.` };
}

/** Remove admin access. Their normal account (courses, webinars) stays. They are signed out everywhere. */
export async function removeStaff(fd: FormData) {
  const actor = await guard("team");
  const id = str(fd, "id");
  if (id === actor.id) return;
  const [target] = await db.select({ role: schema.users.role, staffRole: schema.users.staffRole }).from(schema.users).where(eq(schema.users.id, id)).limit(1);
  const current = target && effective(target);
  if (!current) return;
  if (current === "super_admin" && (actor.staffRole !== "super_admin" || (await otherSuperAdmins(id)) === 0)) return;
  await db.update(schema.users).set({ role: "user", staffRole: null }).where(eq(schema.users.id, id));
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, id));
  await audit(actor.id, "remove", "staff", id, { role: current });
  const [gone] = await db.select({ name: schema.users.name, email: schema.users.email }).from(schema.users).where(eq(schema.users.id, id)).limit(1);
  await notifyTeam({
    event: "team",
    subject: "Admin access removed",
    headline: `${gone?.name ?? "A team member"} no longer has admin access`,
    rows: [
      ["Person", `${gone?.name ?? ""} (${gone?.email ?? ""})`],
      ["Was", ROLE_INFO[current].label],
      ["Removed by", actor.name],
    ],
    link: "/admin/team",
    linkLabel: "Open the team page",
  });
  refresh();
}

/* ───────────── Accepting an invite (called by the invited person, not by an admin) ───────────── */

export async function acceptInvite(fd: FormData) {
  const token = str(fd, "token");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invite?token=${token}`)}`);
  const inv = await findOpenInvite(token);
  // The link only works for the account with the invited email address.
  if (!inv || inv.email !== user.email.toLowerCase()) redirect(`/invite?token=${encodeURIComponent(token)}`);
  await db.transaction(async (tx) => {
    // Marking it used first means a link can never be used twice, even with two quick clicks.
    const used = await tx
      .update(schema.staffInvites)
      .set({ acceptedAt: new Date(), acceptedBy: user.id })
      .where(and(eq(schema.staffInvites.id, inv.id), isNull(schema.staffInvites.acceptedAt)))
      .returning({ id: schema.staffInvites.id });
    if (!used.length) return;
    // The email link proves they own the address, so the email counts as confirmed.
    await tx
      .update(schema.users)
      .set({ role: "admin", staffRole: inv.staffRole, emailVerifiedAt: sql`coalesce(${schema.users.emailVerifiedAt}, now())` })
      .where(eq(schema.users.id, user.id));
  });
  await audit(user.id, "accept_invite", "staff", inv.id, { role: inv.staffRole });
  await notifyTeam({
    event: "team",
    subject: "Someone joined the admin team",
    headline: `${user.name} accepted the invitation`,
    rows: [
      ["Person", `${user.name} (${user.email})`],
      ["Role", ROLE_INFO[inv.staffRole].label],
    ],
    link: "/admin/team",
    linkLabel: "Open the team page",
  });
  redirect("/admin?joined=1");
}

/**
 * Each team member turns their own alert emails on or off, from the admin
 * dashboard. It never changes anyone else's setting.
 */
export async function setMyAlerts(fd: FormData): Promise<void> {
  const me = await requireAdmin();
  const on = str(fd, "on") === "1";
  await db.update(schema.users).set({ notifyByEmail: on }).where(eq(schema.users.id, me.id));
  refresh();
}
