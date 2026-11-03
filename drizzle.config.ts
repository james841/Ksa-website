import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile?.(".env");
} catch {
  // .env is optional when DATABASE_URL is already set in the environment
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations need a direct connection. On Supabase, DATABASE_URL is the pooled
  // connection used by the website, and DIRECT_DATABASE_URL is the direct one.
  dbCredentials: { url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL! },
  strict: true,
});
