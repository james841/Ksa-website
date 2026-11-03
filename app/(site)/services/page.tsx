import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { services } from "@/lib/content";
import { PageHero } from "@/components/ui/page-hero";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CtaBand } from "@/components/home/faq-cta";
import { InstitutionsPreview } from "@/components/home/institutions";
import { JsonLd } from "@/components/seo/json-ld";
import { ArrowRight } from "@/components/ui/icons";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Research Services for Postgraduate Students and Researchers",
  description:
    "Research topic identification, research design, qualitative and quantitative data analysis, thesis chapters, editing, journal manuscripts and proposal development.",
  alternates: { canonical: "/services" },
  openGraph: { url: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Services", path: "/services" }]}
        kicker="Research services"
        title="Personalised support across your research journey"
        lead="Every engagement is tailored to your research objectives, your discipline and your institution's requirements. Choose the stage you need help with, or talk to us about end-to-end support."
      />
      <section className="bg-white py-16 sm:py-20">
        <div className="container-x">
          <RevealGroup className="grid gap-6 md:grid-cols-2" stagger={0.06}>
            {services.map((s, i) => (
              <RevealItem key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="group grid h-full overflow-hidden rounded-[1.5rem] bg-mist ring-1 ring-line transition-shadow hover:shadow-lift sm:grid-cols-[42%_1fr]"
                >
                  <div className="relative aspect-[16/11] sm:aspect-auto">
                    <Image src={s.image} alt="" fill sizes="(max-width: 640px) 92vw, 280px" className="lite-hide object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />
                  </div>
                  <div className="flex flex-col p-6 sm:p-7">
                    <span className="font-display text-sm text-blue">{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="mt-2 font-display text-2xl leading-snug text-ink">{s.title}</h2>
                    <p className="mt-3 flex-1 leading-relaxed text-muted">{s.short}</p>
                    <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue">
                      Explore this service <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
      <InstitutionsPreview />
      <div className="pt-20 sm:pt-24">
        <CtaBand />
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: services.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/services/${s.slug}`), name: s.title })),
        }}
      />
    </>
  );
}
