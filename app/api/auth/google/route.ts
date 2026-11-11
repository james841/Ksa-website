import { redirect } from "next/navigation";
import { googleEnabled, safeNext, startGoogle } from "@/lib/auth/oauth";

/** Step one: send the person to Google. */
export async function GET(req: Request) {
  if (!googleEnabled()) redirect("/login?oauth=off");
  const next = safeNext(new URL(req.url).searchParams.get("next"));
  redirect(await startGoogle(next));
}
