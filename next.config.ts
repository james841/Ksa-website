import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy: the browser only loads scripts, styles, fonts and images
 * from this site, and only embeds videos from the listed players. This blocks most
 * injected-script (XSS) attacks even if something slips through.
 * Next.js needs 'unsafe-inline' for its small inline boot scripts; 'unsafe-eval' only in development.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self' https:",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://iframe.mediadelivery.net",
  "frame-ancestors 'self'",
  /*
   * The checkout page posts the signed payment form to PayFast.
   *
   * Every payfast.co.za address has to be allowed, not just the one the form posts
   * to: PayFast answers that post with a redirect to its payment engine, which sits
   * on another host of theirs (payfast.co.za without www, and w1w/w2w under load).
   * The browser checks this rule again on the redirect, and when the new host is not
   * listed it blocks the whole thing and reports the FIRST address instead of the
   * one that failed. The result is a button that looks like it does nothing at all.
   */
  "form-action 'self' https://payfast.co.za https://*.payfast.co.za",
  "base-uri 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  // Only when the live site runs on https (so local "npm start" on http still works).
  ...((process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://") ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    // Larger limit so admins can upload course PDFs and images through server actions.
    serverActions: { bodySizeLimit: "25mb" },
  },
  // Static shell + cached data ("use cache") for very fast public pages.
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  compress: true,
  images: {
    // AVIF first (smallest), WebP fallback. Next resizes per device automatically.
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [48, 64, 96, 128, 200, 256, 320, 400],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/brand/**" },
      { pathname: "/media/**" },
    ],
    // The default homepage photo is served from Unsplash's image CDN (free Unsplash License).
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-**" }],
  },
  // The quote form became the service request form; old links still work.
  async redirects() {
    return [{ source: "/request-a-quote", destination: "/request-a-service", permanent: true }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: immutable },
      { source: "/brand/:path*", headers: immutable },
      // Private and admin areas are never stored by browsers or shared caches.
      { source: "/(admin|dashboard|learn)/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
