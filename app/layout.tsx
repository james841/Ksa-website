import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { MotionProvider } from "@/components/motion/motion-provider";
import { brand } from "@/lib/content";
import { siteUrl } from "@/lib/utils";
import { liteBootScript } from "@/lib/lite-boot";
import "./globals.css";

const jakarta = localFont({
  src: "./fonts/plus-jakarta-sans-latin-wght-normal.woff2",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
});

// Headings, buttons and labels.
const poppins = localFont({
  src: [
    { path: "./fonts/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Knowledge Space Academy | Research Support, Training and Mentorship",
    template: "%s | Knowledge Space Academy",
  },
  description:
    "Expert research support for postgraduate students, academics and institutions: topic selection, research design, data analysis, thesis chapters, editing and journal publication. Free monthly research webinars.",
  applicationName: brand.name,
  keywords: [
    "research support",
    "thesis help",
    "dissertation support",
    "postgraduate research",
    "PhD support",
    "data analysis help",
    "NVivo training",
    "SPSS help",
    "academic writing",
    "journal manuscript support",
    "research webinars",
    "doctoral mentorship",
  ],
  authors: [{ name: brand.name, url: siteUrl }],
  creator: brand.name,
  publisher: brand.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: brand.name,
    locale: "en_GB",
    url: siteUrl,
    title: "Knowledge Space Academy | Research. Insight. Impact.",
    description: brand.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Knowledge Space Academy | Research. Insight. Impact.",
    description: brand.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  formatDetection: { telephone: false, email: false, address: false },
  category: "education",
};

export const viewport: Viewport = {
  themeColor: "#0b1433",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the data saver script may add data-lite to <html> before React loads.
    <html lang="en-GB" className={`${jakarta.variable} ${poppins.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: liteBootScript }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
