import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { WebinarRow } from "@/components/webinars/webinar-row";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { getPastWebinars, getUpcomingWebinars } from "@/lib/data/public";
import { ArrowRight } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Free Monthly Research Webinars",
  description:
    "Join free monthly research webinars on Zoom covering research planning, postgraduate study, methodology, data analysis and academic writing.",
  alternates: { canonical: "/webinars" },
  openGraph: { url: "/webinars" },
};

export default async function WebinarsPage() {
  const [upcoming, past] = await Promise.all([getUpcomingWebinars(24), getPastWebinars(12)]);
  return (
    <>
      <PageHero
        crumbs={[{ name: "Webinars", path: "/webinars" }]}
        kicker="Free monthly research webinars"
        title="Accessible opportunities to learn, reflect and stay connected"
        lead="KSA offers several free webinars each month via Zoom for postgraduate students, faculty and researchers. Sessions give practical guidance, space for questions and the chance to learn alongside a wider research community."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register?next=/webinars" className="btn btn-primary group">
            Create a free account <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/login?next=/webinars" className="btn btn-ghost bg-white/60">
            Log in
          </Link>
        </div>
      </PageHero>

      <section className="bg-white py-16 sm:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="font-display text-3xl text-ink">Upcoming webinars</h2>
            {upcoming.length ? (
              <div className="mt-4 border-b border-line">
                {upcoming.map((w) => (
                  <WebinarRow key={w.id} w={w} />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-mist p-6 text-muted ring-1 ring-line">
                New sessions are announced every month. Subscribe on the right and we will tell you as soon as registration opens.
              </p>
            )}

            {past.length ? (
              <>
                <h2 className="mt-16 font-display text-3xl text-ink">Past webinars</h2>
                <div className="mt-4 border-b border-line">
                  {past.map((w) => (
                    <WebinarRow key={w.id} w={w} past />
                  ))}
                </div>
              </>
            ) : null}
          </div>
          <aside className="lg:col-span-4">
            <Reveal className="sticky top-28 space-y-5">
              <div className="rounded-[1.5rem] bg-ink p-7 text-white">
                <p className="font-display text-2xl">Never miss a session</p>
                <p className="mt-2 text-sm text-white/70">Get webinar announcements by email. One click to unsubscribe.</p>
                <div className="mt-5">
                  <NewsletterForm source="webinars_page" />
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-mist p-7 ring-1 ring-line">
                <p className="font-semibold text-ink">For institutions</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Institutions are welcome to share these webinars with their staff and students as an additional source of
                  research and postgraduate support.
                </p>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}
