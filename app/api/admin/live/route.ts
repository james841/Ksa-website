import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { livePages, liveNow } from "@/lib/analytics/queries";

/** Feeds the live counter on the traffic page. Super admins and admins only. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.staffRole || !can(user.staffRole, "analytics")) {
    return new Response("Not allowed", { status: 403 });
  }
  const [now, top] = await Promise.all([liveNow(), livePages()]);
  return Response.json({ ...now, top }, { headers: { "Cache-Control": "no-store" } });
}
