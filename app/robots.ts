import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/learn", "/api/", "/reset-password", "/verify-email", "/unsubscribe"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
