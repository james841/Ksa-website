import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/utils";

/**
 * robots.txt, served at /robots.txt.
 *
 * Everything a visitor can read is open to search engines. Everything behind a
 * sign-in, or personal to one person, is kept out: not for secrecy (those pages
 * check the session anyway) but so Google never lists a page that answers with
 * "please log in", and never indexes a one-time link from an email.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    "/admin", // the whole back office
    "/dashboard", // a learner's own account
    "/learn", // course players, for enrolled learners
    "/checkout", // one payment, belonging to one person
    "/api/", // machine endpoints, including the PayFast notification
    "/reset-password",
    "/verify-email",
    "/unsubscribe",
  ];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      // Search previews quote pages verbatim; the pages above should never be quoted.
      { userAgent: "Googlebot", allow: "/", disallow: privatePaths },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
