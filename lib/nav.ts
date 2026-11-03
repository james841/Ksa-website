import { services, institutionalServices } from "@/lib/content";

export const mainNav = [
  { label: "Services", href: "/services", mega: true },
  { label: "Institutions", href: "/institutions" },
  { label: "Webinars", href: "/webinars" },
  { label: "Courses", href: "/courses" },
  { label: "Publishing", href: "/publishing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const serviceLinks = services.map((s) => ({ label: s.title, href: `/services/${s.slug}`, text: s.short }));
export const institutionLinks = institutionalServices.map((s) => ({ label: s.title, href: `/institutions#${s.slug}` }));
