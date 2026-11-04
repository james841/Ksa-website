import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { ServiceMarquee } from "@/components/home/marquee";
import { AboutPreview } from "@/components/home/about";
import { ServicesGrid } from "@/components/home/services-grid";
import { Learning } from "@/components/home/learning";
import { CtaBand } from "@/components/home/faq-cta";
import { getPublicCourses, getSettings, getSlides, getUpcomingWebinars } from "@/lib/data/public";
import { homeHighlights } from "@/lib/content";
import { SiteShell } from "@/components/layout/site-shell";
import { DEFAULT_HERO_IMAGE } from "@/lib/settings-types";

export const metadata: Metadata = {
  title: { absolute: "Knowledge Space Academy | Research Support, Training and Mentorship" },
  alternates: { canonical: "/" },
};

// The homepage sits at app/page.tsx (outside the (site) group), so it adds the site shell itself.
export default async function HomePage() {
  const [settings, slides, webinars, courses] = await Promise.all([
    getSettings(),
    getSlides(),
    getUpcomingWebinars(3),
    getPublicCourses(),
  ]);

  const carousel = slides.length
    ? slides.map((s) => ({ id: s.id, title: s.title, caption: s.caption, href: s.href, image: s.image }))
    : homeHighlights.map((h) => ({ id: h.id, title: h.title, caption: h.caption, href: h.href, image: h.image }));

  return (
    <SiteShell>
      <Hero badge={settings.heroBadge} slides={carousel} image={settings.heroImage || DEFAULT_HERO_IMAGE} />
      <ServiceMarquee />
      <AboutPreview />
      <ServicesGrid />
      <Learning webinars={webinars} courses={courses} />
      <CtaBand />
    </SiteShell>
  );
}
