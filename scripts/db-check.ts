/**
 * Checks the database connection and setup, and explains any problem in plain English.
 *   npm run db:check
 */
import { Pool } from "pg";
import { describeDbError } from "../lib/db/errors";

const expected = [
  "users", "sessions", "auth_tokens", "email_subscriptions", "consent_events", "quote_requests", "quote_notes", "media",
  "webinars", "webinar_registrations", "courses", "course_modules", "lessons", "lesson_resources", "enrollments",
  "lesson_progress", "course_interest", "email_campaigns", "campaign_recipients", "site_settings", "faqs", "board_members",
  "home_slides", "audit_logs", "staff_invites",
];

/** Columns added after the first release. Missing ones mean a migration has not been run. */
const expectedColumns: Array<[string, string]> = [
  ["users", "staff_role"],
  ["users", "notify_by_email"],
  ["courses", "low_data"],
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("✗ DATABASE_URL is missing. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }
  const safe = url.replace(/:\/\/([^:]+):[^@]*@/, "://$1:****@");
  console.log(`Checking ${safe}\n`);
  const pool = new Pool({ connectionString: url, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
  try {
    const { rows } = await pool.query("select version() as v, current_database() as db");
    console.log(`✓ Connected to "${rows[0].db}" (${String(rows[0].v).split(",")[0]})`);
    const t = await pool.query<{ table_name: string }>("select table_name from information_schema.tables where table_schema = 'public'");
    const have = new Set(t.rows.map((r) => r.table_name));
    const missing = expected.filter((x) => !have.has(x));
    if (missing.length) {
      console.log(`✗ ${missing.length} tables are missing (${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ", …" : ""}).`);
      console.log("  Fix: npm run setup");
      process.exit(1);
    }
    console.log(`✓ All ${expected.length} tables exist`);

    const cols = await pool.query<{ table_name: string; column_name: string }>(
      "select table_name, column_name from information_schema.columns where table_schema = 'public'",
    );
    const haveCols = new Set(cols.rows.map((r) => `${r.table_name}.${r.column_name}`));
    const missingCols = expectedColumns.filter(([t, c]) => !haveCols.has(`${t}.${c}`));
    if (missingCols.length) {
      console.log(`✗ ${missingCols.length} newer column(s) are missing: ${missingCols.map(([t, c]) => `${t}.${c}`).join(", ")}`);
      console.log("  Fix: npm run db:migrate");
      process.exit(1);
    }
    console.log("✓ Database is up to date with the latest changes");

    const [{ count: pending }] = (
      await pool.query<{ count: string }>("select count(*)::text as count from drizzle.__drizzle_migrations").catch(() => ({ rows: [{ count: "?" }] }))
    ).rows;
    console.log(`✓ Migrations recorded: ${pending}`);
    const a = await pool.query<{ email: string }>("select email from users where role = 'admin' order by created_at limit 5");
    if (!a.rows.length) {
      console.log("✗ No admin account yet. Fix: npm run create-admin (uses ADMIN_EMAIL and ADMIN_PASSWORD from .env)");
      process.exit(1);
    }
    console.log(`✓ Admin account(s): ${a.rows.map((r) => r.email).join(", ")}`);
    console.log("\nEverything looks good. Start the site with: npm run dev");
  } catch (e) {
    const d = describeDbError(e);
    console.log(`✗ ${d.reason}\n  Fix: ${d.fix}${d.code ? `\n  (PostgreSQL code ${d.code})` : ""}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
