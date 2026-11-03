/**
 * Fills a fresh database with the starting content from the KSA brief.
 * Safe to run more than once: each table is only filled when it is empty.
 *   npm run db:seed
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { defaultBoard, defaultFaqs, plannedCourses, services } from "../lib/content";
import { defaultSettings } from "../lib/settings-types";
import { createAdmin } from "./create-admin";
import { describeDbError } from "../lib/db/errors";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
  const db = drizzle(pool, { schema });
  const isEmpty = async (table: string) => {
    const r = await db.execute(sql.raw(`select count(*)::int as n from ${table}`));
    return (r.rows[0] as { n: number }).n === 0;
  };

  if (await isEmpty("site_settings")) {
    await db.insert(schema.siteSettings).values(Object.entries(defaultSettings).map(([key, value]) => ({ key, value })));
    console.log("✓ site settings");
  }
  if (await isEmpty("faqs")) {
    await db.insert(schema.faqs).values(defaultFaqs.map((f, i) => ({ question: f.q, answer: f.a, position: i, showOnHome: f.home })));
    console.log("✓ FAQs");
  }
  if (await isEmpty("board_members")) {
    await db.insert(schema.boardMembers).values(defaultBoard.map((b, i) => ({ ...b, position: i })));
    console.log("✓ advisory board");
  }
  if (await isEmpty("home_slides")) {
    await db.insert(schema.homeSlides).values(
      services.map((s, i) => ({ title: s.title, caption: s.short, href: `/services/${s.slug}`, image: s.image, position: i })),
    );
    console.log("✓ homepage carousel slides");
  }
  // Point older carousel cards at the updated blue artwork (safe to run again).
  await db.execute(sql.raw("update home_slides set image = regexp_replace(image, '^/images/services/([a-z]+)[.]webp$', '/images/services/\\1-blue.webp')"));
  if (await isEmpty("courses")) {
    await db.insert(schema.courses).values(
      plannedCourses.map((c, i) => {
        const [title, subtitle] = c.title.split(/:\s*/);
        return {
          slug: slugify(title),
          title: c.title,
          subtitle: subtitle ?? null,
          summary: c.summary,
          description: c.summary,
          category: c.category,
          status: "coming_soon" as const,
          position: i,
        };
      }),
    );
    console.log("✓ 14 planned courses (status: coming soon)");
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await createAdmin(db);
  } else {
    console.log("! ADMIN_EMAIL / ADMIN_PASSWORD not set, skipped admin account");
  }

  await pool.end();
  console.log("Done.");
}

main().catch((e) => {
  const d = describeDbError(e);
  console.error(`\n✗ ${d.reason}\n  Fix: ${d.fix}\n`);
  process.exit(1);
});
