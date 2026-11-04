import { services, institutionalServices } from "@/lib/content";

/** The partner journal, published by the University of Johannesburg. */
export const JOURNAL_URL = "https://journals.uj.ac.za/index.php/djis/index";
export const JOURNAL_NAME = "De-centre: Journal of Interdisciplinary Studies";

export type NavChild = { label: string; href: string; text?: string; external?: boolean };

/**
 * The main menu.
 *
 * Only six top-level links, so nothing is crowded. "Services" opens the full
 * panel (individual and institutional services side by side), while
 * "Publishing" and "About" open a short list, which is where the longer pages
 * that used to sit on the homepage now live.
 */
export const mainNav: Array<{ label: string; href: string; mega?: boolean; menu?: NavChild[] }> = [
  { label: "Services", href: "/services", mega: true },
  { label: "Webinars", href: "/webinars" },
  { label: "Courses", href: "/courses" },
  {
    label: "Publishing",
    href: "/publishing",
    menu: [
      { label: "Publishing support", href: "/publishing", text: "Help getting your work published" },
      { label: "Conferences and events", href: "/publishing#conferences", text: "Where we convene researchers" },
      { label: JOURNAL_NAME, href: JOURNAL_URL, text: "Our partner journal, open access", external: true },
    ],
  },
  {
    label: "About",
    href: "/about",
    menu: [
      { label: "About us", href: "/about", text: "Who we are and how we work" },
      { label: "Advisory board", href: "/about#advisory-board", text: "The researchers guiding KSA" },
      { label: "Why choose us", href: "/about#why", text: "What makes our support different" },
      { label: "FAQs", href: "/faqs", text: "Questions people ask us most" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export const serviceLinks = services.map((s) => ({ label: s.title, href: `/services/${s.slug}`, text: s.short }));
export const institutionLinks = institutionalServices.map((s) => ({ label: s.title, href: `/institutions#${s.slug}`, text: s.lead }));
