import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Knowledge Space Academy",
    short_name: "KSA",
    description: "Research. Insight. Impact. Research support, training and mentorship.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b1433",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
