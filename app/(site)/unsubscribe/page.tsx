import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { unsubscribeByToken } from "@/lib/subscriptions";
import { getClientInfo } from "@/lib/request";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  return (
    <section className="bg-mist py-24">
      <div className="container-x max-w-xl text-center">
        <Suspense fallback={<p className="text-muted">Updating your preferences…</p>}>
          <Result searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function Result({ searchParams }: Pick<PageProps<"/unsubscribe">, "searchParams">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const { ip } = await getClientInfo();
  const sub = token ? await unsubscribeByToken(token, "email_link", ip) : null;
  return sub ? (
    <>
      <h1 className="text-4xl text-ink">You have been unsubscribed</h1>
      <p className="mt-3 text-muted">
        {sub.email} will no longer receive KSA announcements. You will still get essential emails about your account and any webinars you register for.
      </p>
      <Link href="/" className="btn btn-dark mt-8">Back to the website</Link>
    </>
  ) : (
    <>
      <h1 className="text-4xl text-ink">This link is not valid</h1>
      <p className="mt-3 text-muted">You can manage email preferences from your account settings.</p>
      <Link href="/dashboard/settings" className="btn btn-dark mt-8">Account settings</Link>
    </>
  );
}
