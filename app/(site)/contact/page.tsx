import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { QuoteForm } from "@/components/forms/quote-form";
import { getSettings } from "@/lib/data/public";
import { Mail, Phone, Pin, WhatsApp } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Knowledge Space Academy by email, WhatsApp or our enquiry form. We provide customised research support based on your needs.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const channels = [
    s.supportEmail && { Icon: Mail, label: "Email", value: s.supportEmail, href: `mailto:${s.supportEmail}` },
    s.whatsapp && { Icon: WhatsApp, label: "WhatsApp", value: s.whatsapp, href: `https://wa.me/${s.whatsapp.replace(/\D/g, "")}` },
    s.phone && { Icon: Phone, label: "Phone", value: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}` },
    s.address && { Icon: Pin, label: "Address", value: s.address, href: null },
  ].filter(Boolean) as Array<{ Icon: typeof Mail; label: string; value: string; href: string | null }>;

  return (
    <>
      <PageHero
        crumbs={[{ name: "Contact us", path: "/contact" }]}
        kicker="Contact us"
        title="We provide customised research support based on your needs"
        lead="Over the last decade, our research support programmes have helped postgraduate students complete their degrees in record time. Tell us what you are working on."
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <aside className="space-y-4 lg:col-span-4">
            {channels.map(({ Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4 rounded-[1.25rem] bg-mist p-5 ring-1 ring-line">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-white">
                  <Icon size={19} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-muted">{label}</p>
                  {href ? (
                    <a href={href} className="break-words font-semibold text-ink hover:text-blue" target={href.startsWith("http") ? "_blank" : undefined} rel="noopener">
                      {value}
                    </a>
                  ) : (
                    <p className="font-semibold text-ink">{value}</p>
                  )}
                </div>
              </div>
            ))}
            <div className="rounded-[1.25rem] bg-ink p-6 text-white">
              <p className="font-display text-xl">Experienced team. Affordable pricing. Zero plagiarism policy.</p>
              <p className="mt-3 text-sm text-white/70">
                Looking for answers first? Read our <Link href="/faqs" className="underline">frequently asked questions</Link>.
              </p>
            </div>
          </aside>
          <div className="lg:col-span-8">
            <h2 className="font-display text-3xl text-ink">Send us your request</h2>
            <p className="mb-8 mt-2 text-muted">Every request is saved and answered by our team.</p>
            <QuoteForm />
          </div>
        </div>
      </section>
    </>
  );
}
