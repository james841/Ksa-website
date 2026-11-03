import { getSettings } from "@/lib/data/public";
import { brand } from "@/lib/content";
import { absoluteUrl, siteUrl } from "@/lib/utils";

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped for "<" so it cannot close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export async function OrganizationJsonLd() {
  const s = await getSettings();
  const sameAs = Object.values(s.socials).filter(Boolean);
  return (
    <JsonLd
      data={[
        {
          "@context": "https://schema.org",
          "@type": ["EducationalOrganization", "ProfessionalService"],
          "@id": `${siteUrl}/#organization`,
          name: brand.name,
          alternateName: "KSA",
          slogan: brand.tagline,
          description: brand.description,
          url: siteUrl,
          logo: absoluteUrl("/brand/icon-512.png"),
          image: absoluteUrl("/opengraph-image.jpg"),
          ...(s.supportEmail ? { email: s.supportEmail } : {}),
          ...(s.phone ? { telephone: s.phone } : {}),
          ...(s.address ? { address: s.address } : {}),
          ...(sameAs.length ? { sameAs } : {}),
          knowsAbout: [
            "Research design",
            "Qualitative data analysis",
            "Quantitative data analysis",
            "NVivo",
            "SPSS",
            "Academic writing",
            "Thesis supervision support",
            "Journal publication",
            "Doctoral mentorship",
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          url: siteUrl,
          name: brand.name,
          publisher: { "@id": `${siteUrl}/#organization` },
          inLanguage: "en-GB",
        },
      ]}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; path: string }> }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [{ name: "Home", path: "/" }, ...items].map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: absoluteUrl(it.path),
        })),
      }}
    />
  );
}

export function FaqJsonLd({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
      }}
    />
  );
}
