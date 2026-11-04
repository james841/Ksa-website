import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { services, serviceBySlug } from "@/lib/content";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CtaBand } from "@/components/home/faq-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { ArrowRight, Check } from "@/components/ui/icons";
import { absoluteUrl, siteUrl } from "@/lib/utils";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  if (!s) return {};
  return {
    title: `${s.title} Support`,
    description: s.metaDescription,
    keywords: s.keywords,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: { url: `/services/${s.slug}`, title: `${s.title} | Knowledge Space Academy`, description: s.metaDescription, images: [{ url: s.image, width: 800, height: 1000 }] },
  };
}

export default function ServicePage({ params }: PageProps<"/services/[slug]">) {
  // Reading params inside Suspense keeps the shared prefetch shell URL-independent.
  // Every service is prerendered at build time, so visitors never see the fallback.
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-mist" aria-busy="true" />}>
      <ServiceContent params={params} />
    </Suspense>
  );
}

async function ServiceContent({ params }: Pick<PageProps<"/services/[slug]">, "params">) {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  if (!s) notFound();
  const others = services.filter((x) => x.slug !== s.slug).slice(0, 3);

  return (
    <>
      <section className="paper-grain relative overflow-hidden bg-mist">
        <div className="container-x grid items-center gap-10 pb-16 pt-10 sm:pt-12 lg:grid-cols-12 lg:gap-14 lg:pb-20">
          <div className="lg:col-span-7">
            <Breadcrumbs items={[{ name: "Services", path: "/services" }, { name: s.title, path: `/services/${s.slug}` }]} />
            <Reveal className="mt-10 sm:mt-14">
              <p className="kicker">Research service</p>
              <h1 className="mt-4 text-[clamp(2.1rem,4.8vw,3.6rem)] font-bold leading-[1.12] tracking-[-0.03em] text-ink">{s.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{s.intro[0]}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={`/request-a-service?service=${encodeURIComponent(s.title)}`} className="btn btn-primary group">
                  Request a service <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/contact" className="btn btn-ghost bg-white/60">
                  Ask a question
                </Link>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="relative mx-auto aspect-[4/5] max-w-sm overflow-hidden rounded-[1.8rem] shadow-lift lg:max-w-none">
              <Image src={s.image} alt={`${s.title} illustration`} fill priority sizes="(max-width: 1024px) 384px, 460px" className="object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="container-x grid gap-14 lg:grid-cols-12">
          <article className="lg:col-span-8">
            {s.intro.slice(1).map((p) => (
              <Reveal key={p.slice(0, 20)}>
                <p className="max-w-3xl text-lg leading-relaxed text-ink/85">{p}</p>
              </Reveal>
            ))}
            {s.sections.map((sec) => (
              <div key={sec.heading} className="mt-14">
                <Reveal>
                  <h2 className="text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight text-ink">{sec.heading}</h2>
                  {sec.intro ? <p className="mt-4 max-w-3xl leading-relaxed text-muted">{sec.intro}</p> : null}
                </Reveal>
                {sec.style === "steps" ? (
                  <RevealGroup className="mt-8 grid gap-5 sm:grid-cols-3">
                    {sec.items.map((it, i) => (
                      <RevealItem key={it.title} className="rounded-[1.25rem] bg-mist p-6 ring-1 ring-line">
                        <p className="font-display text-2xl text-blue">#{String(i + 1).padStart(2, "0")}</p>
                        <h3 className="mt-3 font-sans text-lg font-semibold tracking-normal text-ink">{it.title}</h3>
                        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{it.text}</p>
                      </RevealItem>
                    ))}
                  </RevealGroup>
                ) : (
                  <RevealGroup className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    {sec.items.map((it) => (
                      <RevealItem key={it.title} className="flex gap-4">
                        <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${sec.style === "checks" ? "bg-blue text-white" : "bg-blue-50 text-blue"}`}>
                          <Check size={16} />
                        </span>
                        <div>
                          <h3 className="font-sans text-base font-semibold tracking-normal text-ink">{it.title}</h3>
                          {it.text ? <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">{it.text}</p> : null}
                        </div>
                      </RevealItem>
                    ))}
                  </RevealGroup>
                )}
              </div>
            ))}
          </article>

          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-5">
              <div className="rounded-[1.5rem] bg-ink p-7 text-white">
                <p className="font-display text-2xl leading-snug">Get a tailored plan for your {s.title.toLowerCase()}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Share your requirements, guidelines and timeline. We will reply with a clear plan of support and a quote.
                </p>
                <Link href={`/request-a-service?service=${encodeURIComponent(s.title)}`} className="btn btn-light mt-6 w-full">
                  Request a service
                </Link>
                <ul className="mt-6 space-y-2 text-sm text-white/75">
                  {["Experienced team", "Affordable pricing", "Zero plagiarism policy"].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <Check size={15} className="text-blue-100" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.5rem] bg-mist p-7 ring-1 ring-line">
                <p className="font-semibold text-ink">Other services</p>
                <ul className="mt-3 space-y-2">
                  {services
                    .filter((x) => x.slug !== s.slug)
                    .map((x) => (
                      <li key={x.slug}>
                        <Link href={`/services/${x.slug}`} className="link-u text-[0.95rem] text-muted hover:text-ink">
                          {x.title}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white pb-20">
        <div className="container-x">
          <h2 className="font-display text-2xl text-ink">You may also need</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {others.map((o) => (
              <Link key={o.slug} href={`/services/${o.slug}`} className="group flex items-center gap-4 rounded-[1.25rem] p-3 ring-1 ring-line transition-shadow hover:shadow-soft">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                  <Image src={o.image} alt="" fill sizes="80px" className="object-cover object-top" />
                </div>
                <div>
                  <p className="font-display text-lg leading-snug text-ink group-hover:text-blue">{o.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{o.short}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: s.title,
          serviceType: s.title,
          description: s.metaDescription,
          url: absoluteUrl(`/services/${s.slug}`),
          image: absoluteUrl(s.image),
          provider: { "@id": `${siteUrl}/#organization` },
          areaServed: "Worldwide",
          audience: { "@type": "EducationalAudience", educationalRole: "postgraduate student, researcher, academic" },
        }}
      />
    </>
  );
}
