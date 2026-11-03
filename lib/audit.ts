import "server-only";
import { db, schema } from "@/lib/db";

export async function audit(actorId: string | null, action: string, entity: string, entityId?: string | null, meta?: unknown) {
  try {
    await db.insert(schema.auditLogs).values({ actorId, action, entity, entityId: entityId ?? null, meta: meta ?? null });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}
