/**
 * Creates the first administrator (or promotes an existing account) using
 * ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME from your .env file.
 *   npm run create-admin
 */
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import * as schema from "../lib/db/schema";
import { describeDbError } from "../lib/db/errors";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;

async function hash(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function createAdmin(db: NodePgDatabase<typeof schema>) {
  const email = process.env.ADMIN_EMAIL!.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD!;
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) {
    await db.update(schema.users).set({ role: "admin", staffRole: "super_admin", status: "active" }).where(eq(schema.users.id, existing.id));
    console.log(`✓ ${email} is now an administrator (password unchanged)`);
    return;
  }
  await db.insert(schema.users).values({
    email,
    name: process.env.ADMIN_NAME || "KSA Admin",
    passwordHash: await hash(password),
    role: "admin",
    staffRole: "super_admin",
    emailVerifiedAt: new Date(),
  });
  console.log(`✓ admin account created for ${email}`);
}

if (process.argv[1]?.includes("create-admin")) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
  createAdmin(drizzle(pool, { schema }))
    .then(() => pool.end())
    .catch((e) => {
      const d = describeDbError(e);
      console.error(`\n✗ ${d.reason}\n  Fix: ${d.fix}\n`);
      process.exit(1);
    });
}
