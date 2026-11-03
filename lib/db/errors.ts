/**
 * Turns a PostgreSQL / connection error into a plain-English explanation and fix.
 * Drizzle wraps the real error as `cause`, so we look there first.
 */
export function describeDbError(e: unknown): { code: string; reason: string; fix: string } {
  const err = (e as { cause?: unknown })?.cause ?? e;
  const code = String((err as { code?: string })?.code ?? "");
  const message = String((err as { message?: string })?.message ?? e ?? "");

  if (code === "42P01" || /relation .* does not exist/i.test(message))
    return { code, reason: "The database tables have not been created yet.", fix: "Run: npm run setup" };
  if (code === "3D000" || /database .* does not exist/i.test(message))
    return { code, reason: "The database named in DATABASE_URL does not exist.", fix: "In pgAdmin, create a database called ksa (or fix the name in .env), then run: npm run setup" };
  if (code === "28P01" || /password authentication failed/i.test(message))
    return { code, reason: "PostgreSQL rejected the username or password.", fix: "Fix the password in DATABASE_URL in .env (the one you use to log in to pgAdmin), then restart npm run dev" };
  if (code === "ECONNREFUSED" || /ECONNREFUSED/.test(message))
    return { code, reason: "PostgreSQL is not running or is on a different port.", fix: "Start the PostgreSQL service (Windows: Services > postgresql > Start) and check the port in DATABASE_URL (usually 5432)" };
  if (code === "ENOTFOUND" || /getaddrinfo/.test(message))
    return { code, reason: "The database host in DATABASE_URL cannot be found.", fix: "Use localhost for a database on this computer" };
  if (code === "42703" || /column .* does not exist/i.test(message))
    return { code, reason: "The database is missing a newer column.", fix: "Run: npm run db:migrate" };
  if (!process.env.DATABASE_URL)
    return { code, reason: "DATABASE_URL is not set.", fix: "Copy .env.example to .env and fill in DATABASE_URL" };
  return { code, reason: message.split("\n")[0].slice(0, 200) || "Unknown database error.", fix: "Run: npm run db:check for details" };
}

export function logDbError(label: string, e: unknown) {
  const d = describeDbError(e);
  console.error(`[database] ${label} failed. ${d.reason} Fix: ${d.fix}${d.code ? ` (code ${d.code})` : ""}`);
}
