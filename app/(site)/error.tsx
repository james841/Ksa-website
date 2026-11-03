"use client";

import Link from "next/link";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="bg-mist py-28">
      <div className="container-x max-w-xl">
        <h1 className="text-4xl text-ink">Something went wrong on this page</h1>
        <p className="mt-3 text-muted">This is usually temporary. Try again, or go back to the homepage.</p>
        <div className="mt-8 flex gap-3">
          <button suppressHydrationWarning type="button" onClick={reset} className="btn btn-primary">Try again</button>
          <Link href="/" className="btn btn-ghost">Homepage</Link>
        </div>
      </div>
    </section>
  );
}
