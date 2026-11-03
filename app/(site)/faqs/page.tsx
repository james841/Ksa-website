import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { FaqList } from "@/components/ui/faq-list";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { getFaqs } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "How to get started, citation styles, plagiarism and AI checks, academic integrity and revisions: answers to common questions about Knowledge Space Academy.",
  alternates: { canonical: "/faqs" },
  openGraph: { url: "/faqs" },
};

export default async function FaqsPage() {
  const faqs = await getFaqs();
  return (
    <>
      <PageHero crumbs={[{ name: "FAQs", path: "/faqs" }]} kicker="Help" title="Frequently asked questions" />
      <section className="bg-white py-16 sm:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <FaqList faqs={faqs} />
          </div>
          <aside className="lg:col-span-4">
            <div className="rounded-[1.5rem] bg-mist p-7 ring-1 ring-line">
              <p className="font-display text-2xl text-ink">Still have a question?</p>
              <p className="mt-2 text-muted">Send us a message and our team will get back to you.</p>
              <Link href="/contact" className="btn btn-primary mt-6">
                Contact us
              </Link>
            </div>
          </aside>
        </div>
      </section>
      <FaqJsonLd faqs={faqs} />
    </>
  );
}
