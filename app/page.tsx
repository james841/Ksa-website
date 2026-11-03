import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { Journey } from "@/components/home/journey";
import { ServiceMarquee } from "@/components/home/marquee";
import { AboutPreview } from "@/components/home/about";
import { ServicesGrid } from "@/components/home/services-grid";
import { InstitutionsPreview } from "@/components/home/institutions";
import { Learning } from "@/components/home/learning";
import { Publishing } from "@/components/home/publishing";
import { CtaBand, HomeFaq } from "@/components/home/faq-cta";
import { getBoard, getFaqs, getPublicCourses, getSettings, getSlides, getUpcomingWebinars } from "@/lib/data/public";
import { services } from "@/lib/content";
import { SiteShell } from "@/components/layout/site-shell";
import { DEFAULT_HERO_IMAGE } from "@/lib/settings-types";

export const metadata: Metadata = {
  title: { absolute: "Knowledge Space Academy | Research Support, Training and Mentorship" },
  alternates: { canonical: "/" },
};

// The homepage sits at app/page.tsx (outside the (site) group), so it adds the site shell itself.
export default async function HomePage() {
  const [settings, slides, webinars, courses, faqs, board] = await Promise.all([
    getSettings(),
    getSlides(),
    getUpcomingWebinars(3),
    getPublicCourses(),
    getFaqs(true),
    getBoard(),
  ]);

  const carousel = slides.length
    ? slides.map((s) => ({ id: s.id, title: s.title, caption: s.caption, href: s.href, image: s.image }))
    : services.map((s) => ({ id: s.slug, title: s.title, caption: s.short, href: `/services/${s.slug}`, image: s.image }));

  return (
    <SiteShell>
      <Hero badge={settings.heroBadge} slides={carousel} image={settings.heroImage || DEFAULT_HERO_IMAGE} />
      <Journey />
      <ServiceMarquee />
      <AboutPreview />
      <ServicesGrid />
      <InstitutionsPreview />
      <Learning webinars={webinars} courses={courses} />
      <Publishing board={board} />
      <HomeFaq faqs={faqs} />
      <CtaBand />
    </SiteShell>
  );
}
