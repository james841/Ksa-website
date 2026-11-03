import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { can, ROLE_INFO, type Section, type StaffRole } from "@/lib/auth/permissions";
import { sendTeamAlert } from "@/lib/email/templates";

/*
 * Who gets told what.
 *
 * Every alert belongs to one part of the admin console. It is emailed to:
 *   1. the general address (Admin > Site settings > Alerts email, or
 *      ADMIN_NOTIFY_EMAIL in .env), so nothing is ever missed, and
 *   2. each team member whose role covers that part and who has alerts on.
 *
 * So a quote request reaches Support, a new enrolment reaches the Course
 * manager, and a new subscriber reaches Marketing, without anyone being
 * copied on work that is not theirs.
 */

export type NotifyEvent =
  | "quote"
  | "webinar_registration"
  | "course_enrolment"
  | "course_interest"
  | "subscriber"
  | "new_user"
  | "campaign"
  | "team";

const SECTION_OF: Record<NotifyEvent, Section> = {
  quote: "quotes",
  webinar_registration: "webinars",
  course_enrolment: "courses",
  course_interest: "courses",
  subscriber: "subscribers",
  new_user: "users",
  campaign: "campaigns",
  team: "team",
};

export type Alert = {
  event: NotifyEvent;
  /** Email subject, e.g. "New quote request: Data analysis". */
  subject: string;
  /** One line at the top of the email. */
  headline: string;
  /** Short label and value pairs shown as a table. */
  rows?: Array<[string, string]>;
  /** Longer free text, e.g. what the person wrote. */
  note?: string | null;
  /** Where to go in the admin console, e.g. "/admin/quotes/123". */
  link: string;
  linkLabel?: string;
  /** Set when the alert is about a message from someone, so Reply works. */
  replyTo?: string;
};

/** The general address alerts always go to. */
export async function generalAlertEmail() {
  try {
    const [row] = await db.select({ value: schema.siteSettings.value }).from(schema.siteSettings).where(eq(schema.siteSettings.key, "notifyEmail")).limit(1);
    const fromSettings = typeof row?.value === "string" ? row.value.trim() : "";
    return fromSettings || process.env.ADMIN_NOTIFY_EMAIL?.trim() || "";
  } catch {
    return process.env.ADMIN_NOTIFY_EMAIL?.trim() || "";
  }
}

/** Team members whose role covers this part of the console and who want emails. */
async function teamFor(section: Section) {
  const rows = await db
    .select({ name: schema.users.name, email: schema.users.email, staffRole: schema.users.staffRole })
    .from(schema.users)
    .where(and(eq(schema.users.role, "admin"), eq(schema.users.status, "active"), eq(schema.users.notifyByEmail, true)));
  return rows
    .map((r) => ({ ...r, staffRole: (r.staffRole ?? "super_admin") as StaffRole }))
    .filter((r) => can(r.staffRole, section));
}

/**
 * Sends one alert. It never throws: a website visitor must never see an error
 * because an email could not go out, so problems are logged instead.
 */
export async function notifyTeam(alert: Alert) {
  try {
    const section = SECTION_OF[alert.event];
    const [general, team] = await Promise.all([generalAlertEmail(), teamFor(section)]);
    const seen = new Set<string>();
    const targets: Array<{ email: string; roleLabel: string }> = [];
    if (general) {
      seen.add(general.toLowerCase());
      targets.push({ email: general, roleLabel: "the general alerts address" });
    }
    for (const member of team) {
      const key = member.email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      targets.push({ email: member.email, roleLabel: ROLE_INFO[member.staffRole].label });
    }
    if (!targets.length) return;
    const results = await Promise.allSettled(targets.map((t) => sendTeamAlert(t.email, { ...alert, roleLabel: t.roleLabel })));
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) console.error(`[notify] ${failed} of ${targets.length} alerts failed for "${alert.subject}"`);
  } catch (e) {
    console.error("[notify] could not send alerts", e);
  }
}
