import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/page-hero";
import { QuoteForm, QuoteFormWithParams } from "@/components/forms/quote-form";
import { Check } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Tell us about your research and deadline. Knowledge Space Academy will reply with a tailored plan of support and a quote.",
  alternates: { canonical: "/request-a-quote" },
  openGraph: { url: "/request-a-quote" },
};

export default function QuotePage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Request a quote", path: "/request-a-quote" }]}
        kicker="Request a quote"
        title="Do you have an upcoming research deadline?"
        lead="Schedule a consultation today. Share a few details and we will take it from there."
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Suspense fallback={<QuoteForm />}>
              <QuoteFormWithParams />
            </Suspense>
          </div>
          <aside className="lg:col-span-4">
            <div className="rounded-[1.5rem] bg-ink p-7 text-white">
              <p className="font-display text-2xl">What happens next</p>
              <ol className="mt-5 space-y-5 text-sm text-white/75">
                {[
                  ["We review your request", "A specialist in your area reads your description and requirements."],
                  ["We reply with a plan", "You receive a clear plan of support, a timeline and a quote."],
                  ["We start when you are ready", "Work begins once you confirm the scope."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="font-display text-xl text-blue-100">#{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block font-semibold text-white">{t}</span>
                      {d}
                    </span>
                  </li>
                ))}
              </ol>
              <ul className="mt-8 space-y-2 border-t border-white/10 pt-6 text-sm">
                {["Experienced team", "Affordable pricing", "Zero plagiarism policy"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check size={15} className="text-blue-100" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
