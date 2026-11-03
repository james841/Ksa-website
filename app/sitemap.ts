import type { MetadataRoute } from "next";
import { services } from "@/lib/content";
import { getPastWebinars, getPublicCourses, getUpcomingWebinars } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [upcoming, past, courses] = await Promise.all([getUpcomingWebinars(200), getPastWebinars(200), getPublicCourses()]);
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly") => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/services", 0.9),
    ...services.map((s) => page(`/services/${s.slug}`, 0.85)),
    page("/institutions", 0.8),
    page("/webinars", 0.85, "weekly"),
    ...upcoming.map((w) => page(`/webinars/${w.slug}`, 0.7, "weekly")),
    ...past.map((w) => page(`/webinars/${w.slug}`, 0.4, "yearly")),
    page("/courses", 0.8, "weekly"),
    ...courses.map((c) => page(`/courses/${c.slug}`, 0.6)),
    page("/publishing", 0.6),
    page("/about", 0.7),
    page("/faqs", 0.6),
    page("/contact", 0.6),
    page("/request-a-quote", 0.7),
    page("/register", 0.3),
    page("/privacy", 0.2, "yearly"),
    page("/terms", 0.2, "yearly"),
  ].filter((e, i, arr) => arr.findIndex((x) => x.url === e.url) === i);
}
