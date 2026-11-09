import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { services } from "@/lib/content";
import { absoluteUrl } from "@/lib/utils";

/**
 * sitemap.xml, served at /sitemap.xml.
 *
 * Every page a visitor can reach, with the date it last changed, so a search
 * engine re-reads a webinar or a course the day after it is edited instead of
 * waiting to notice. Private pages are left out here and refused in robots.ts.
 *
 * It reads the two tables directly rather than through lib/data/public.ts,
 * because those helpers are cached for the website and do not carry the
 * "last updated" column this file needs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [webinars, courses] = await Promise.all([
    db
      .select({ slug: schema.webinars.slug, startsAt: schema.webinars.startsAt, updatedAt: schema.webinars.updatedAt })
      .from(schema.webinars)
      .where(eq(schema.webinars.status, "published")),
    db
      .select({ slug: schema.courses.slug, updatedAt: schema.courses.updatedAt })
      .from(schema.courses)
      .where(eq(schema.courses.status, "published")),
  ]).catch(() => [[], []] as const); // a database hiccup must not take the sitemap down

  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly",
    lastModified?: Date | null,
  ) => ({ url: absoluteUrl(path), changeFrequency, priority, ...(lastModified ? { lastModified } : {}) });

  const now = new Date();
  const soonest = webinars.reduce<Date | null>((a, w) => (!a || w.updatedAt > a ? w.updatedAt : a), null);
  const newestCourse = courses.reduce<Date | null>((a, c) => (!a || c.updatedAt > a ? c.updatedAt : a), null);
  const upcoming = webinars.filter((w) => w.startsAt >= now);
  const past = webinars.filter((w) => w.startsAt < now);

  return [
    page("/", 1, "weekly", soonest ?? now),
    page("/services", 0.9),
    ...services.map((s) => page(`/services/${s.slug}`, 0.85)),
    page("/institutions", 0.8),
    page("/webinars", 0.85, "weekly", soonest),
    // Still to come: worth checking often. Already held: a stable record of what happened.
    ...upcoming.map((w) => page(`/webinars/${w.slug}`, 0.7, "weekly", w.updatedAt)),
    ...past.map((w) => page(`/webinars/${w.slug}`, 0.4, "yearly", w.updatedAt)),
    page("/courses", 0.8, "weekly", newestCourse),
    ...courses.map((c) => page(`/courses/${c.slug}`, 0.6, "monthly", c.updatedAt)),
    page("/publishing", 0.7),
    page("/about", 0.8),
    page("/faqs", 0.6),
    page("/contact", 0.6),
    page("/request-a-service", 0.7),
    page("/register", 0.3),
    page("/privacy", 0.2, "yearly"),
    page("/terms", 0.2, "yearly"),
  ].filter((e, i, arr) => arr.findIndex((x) => x.url === e.url) === i);
}
