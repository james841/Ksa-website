import "server-only";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { sha256 } from "./password";

/** An admin team invite that is still open (not used, not expired), found by its link token. */
export async function findOpenInvite(token: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const [inv] = await db
    .select()
    .from(schema.staffInvites)
    .where(and(eq(schema.staffInvites.tokenHash, sha256(token)), isNull(schema.staffInvites.acceptedAt), gt(schema.staffInvites.expiresAt, sql`now()`)))
    .limit(1);
  return inv ?? null;
}
