import { unsubscribeByToken } from "@/lib/subscriptions";

/** One-click unsubscribe (RFC 8058), used by Gmail and Outlook's built-in unsubscribe button. */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const ok = token ? await unsubscribeByToken(token, "one_click") : null;
  return new Response(ok ? "Unsubscribed" : "Invalid token", { status: ok ? 200 : 400 });
}
