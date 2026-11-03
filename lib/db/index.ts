import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

/*
 * On a normal server one pool of 10 connections is right. On Vercel every
 * request can run in its own short-lived instance, so each one keeps a small
 * pool and hands connections back quickly; Supabase's pooler does the sharing.
 */
const onServerless = Boolean(process.env.VERCEL);
const defaultMax = onServerless ? 2 : 10;

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX ?? defaultMax),
    idleTimeoutMillis: onServerless ? 10_000 : 30_000,
    connectionTimeoutMillis: 15_000,
    // Supabase (and most hosted databases) require SSL.
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
