import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { can, type Section } from "@/lib/auth/permissions";

// Which admin section each export belongs to.
const exportSection: Record<string, Section> = { quotes: "quotes", users: "users", subscribers: "subscribers", attendees: "webinars", learners: "courses" };

const csvCell = (v: unknown) => {
  const s = v instanceof Date ? v.toISOString() : v == null ? "" : String(v);
  // Prevent spreadsheet formula injection.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const toCsv = (rows: Record<string, unknown>[]) =>
  rows.length ? [Object.keys(rows[0]).join(","), ...rows.map((r) => Object.values(r).map(csvCell).join(","))].join("\n") : "";

export async function GET(req: Request, ctx: RouteContext<"/api/admin/export/[type]">) {
  const user = await getCurrentUser();
  const { type } = await ctx.params;
  if (!user || user.role !== "admin" || !can(user.staffRole, exportSection[type] ?? "team")) return new Response("Forbidden", { status: 403 });
  const url = new URL(req.url);
  let rows: Record<string, unknown>[] = [];

  if (type === "quotes") {
    rows = await db
      .select({ reference: schema.quoteRequests.reference, created: schema.quoteRequests.createdAt, status: schema.quoteRequests.status, name: schema.quoteRequests.name, email: schema.quoteRequests.email, phone: schema.quoteRequests.phone, country: schema.quoteRequests.country, service: schema.quoteRequests.service, promoCode: schema.quoteRequests.promoCode, description: schema.quoteRequests.description })
      .from(schema.quoteRequests)
      .orderBy(desc(schema.quoteRequests.createdAt));
  } else if (type === "users") {
    rows = await db
      .select({ name: schema.users.name, email: schema.users.email, role: schema.users.role, status: schema.users.status, country: schema.users.country, institution: schema.users.institution, verified: schema.users.emailVerifiedAt, registered: schema.users.createdAt })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt));
  } else if (type === "subscribers") {
    rows = await db
      .select({ email: schema.emailSubscriptions.email, name: schema.emailSubscriptions.name, status: schema.emailSubscriptions.status, source: schema.emailSubscriptions.source, consentedAt: schema.emailSubscriptions.consentedAt, unsubscribedAt: schema.emailSubscriptions.unsubscribedAt })
      .from(schema.emailSubscriptions)
      .orderBy(desc(schema.emailSubscriptions.createdAt));
  } else if (type === "attendees") {
    const webinarId = url.searchParams.get("webinar") ?? "";
    rows = await db
      .select({ name: schema.users.name, email: schema.users.email, country: schema.users.country, institution: schema.users.institution, registered: schema.webinarRegistrations.createdAt, attended: schema.webinarRegistrations.attended })
      .from(schema.webinarRegistrations)
      .innerJoin(schema.users, eq(schema.users.id, schema.webinarRegistrations.userId))
      .where(eq(schema.webinarRegistrations.webinarId, webinarId));
  } else {
    return new Response("Unknown export", { status: 404 });
  }

  await audit(user.id, "export", type);
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ksa-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
