import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { CourseCatalog } from "@/components/courses/catalog";
import { getPublicCourses } from "@/lib/data/public";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Self-Paced Online Research Courses",
  description:
    "Self-paced online courses for postgraduate students and researchers: research topics, proposals, literature reviews, methodology, NVivo, SPSS, thesis writing, publishing and viva preparation.",
  alternates: { canonical: "/courses" },
  openGraph: { url: "/courses" },
};

export default async function CoursesPage() {
  const courses = await getPublicCourses();
  return (
    <>
      <PageHero
        crumbs={[{ name: "Courses", path: "/courses" }]}
        kicker="Self-paced online research courses"
        title="Learn at your pace. Move your research forward."
        lead="KSA is developing self-study online courses that turn complex research concepts into practical steps you can apply to your own work. Course titles and content are being developed, and enrolment details will be announced ahead of launch."
      />
      <section className="bg-white py-14 sm:py-16">
        <div className="container-x">
          <CourseCatalog courses={courses} />
        </div>
      </section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: courses.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/courses/${c.slug}`), name: c.title })),
        }}
      />
    </>
  );
}
