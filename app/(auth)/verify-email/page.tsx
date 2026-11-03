import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { verifyEmailToken } from "@/app/actions/auth";
import { CheckCircle } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false } };

export default function VerifyPage({ searchParams }: PageProps<"/verify-email">) {
  return (
    <Suspense fallback={<p className="text-muted">Confirming your email…</p>}>
      <Result searchParams={searchParams} />
    </Suspense>
  );
}

async function Result({ searchParams }: Pick<PageProps<"/verify-email">, "searchParams">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const ok = token ? await verifyEmailToken(token) : false;
  return ok ? (
    <div>
      <CheckCircle size={44} className="text-blue" />
      <h1 className="mt-5 text-4xl text-ink">Email confirmed</h1>
      <p className="mt-2 text-muted">Thank you. Your account is ready.</p>
      <Link href="/dashboard" className="btn btn-primary mt-8">Go to my dashboard</Link>
    </div>
  ) : (
    <div>
      <h1 className="text-4xl text-ink">This link has expired</h1>
      <p className="mt-2 text-muted">Log in and request a new confirmation email from your dashboard.</p>
      <Link href="/login" className="btn btn-primary mt-8">Log in</Link>
    </div>
  );
}
