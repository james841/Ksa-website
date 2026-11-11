import { touchSession } from "@/lib/auth/session";

/**
 * Keeps a session alive while someone is actually using the website.
 *
 * The idle guard in the browser calls this when the person says "stay signed in",
 * and quietly in the background while they are working. It answers whether the
 * session is still good, so the page can send them to the login screen the moment
 * it is not, rather than letting them type into a form that will be refused.
 */
export async function POST() {
  const alive = await touchSession().catch(() => false);
  return Response.json({ alive }, { status: alive ? 200 : 401 });
}
