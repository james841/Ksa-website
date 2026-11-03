import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="paper-grain flex min-h-dvh flex-col bg-mist">
      <div className="container-x py-8"><Logo className="h-9 w-auto" /></div>
      <main id="main" className="container-x flex flex-1 flex-col items-start justify-center pb-24">
        <p className="kicker">Page not found</p>
        <h1 className="mt-4 max-w-2xl text-[clamp(2.1rem,4.8vw,3.6rem)] font-bold leading-[1.12] text-ink">This page has drifted out of orbit</h1>
        <p className="mt-5 max-w-lg text-lg text-muted">The link may be old or mistyped. Try one of these instead.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary">Go to the homepage</Link>
          <Link href="/services" className="btn btn-ghost">Our services</Link>
          <Link href="/contact" className="btn btn-ghost">Contact us</Link>
        </div>
      </main>
    </div>
  );
}
