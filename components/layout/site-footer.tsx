import Link from "next/link";
import { cacheLife } from "next/cache";
import { getSettings } from "@/lib/data/public";
import { services } from "@/lib/content";
import { Logo } from "./logo";
import { DataSaverToggle } from "@/components/ui/data-saver-toggle";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { Facebook, Instagram, LinkedIn, Mail, Phone, Pin, TikTok, WhatsApp, XLogo, YouTube } from "@/components/ui/icons";

const explore = [
  { label: "About us", href: "/about" },
  { label: "For institutions", href: "/institutions" },
  { label: "Free webinars", href: "/webinars" },
  { label: "Online courses", href: "/courses" },
  { label: "Publishing and conferences", href: "/publishing" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact us", href: "/contact" },
];

export async function SiteFooter() {
  const settings = await getSettings();
  const so = settings.socials;
  const socials = [
    { href: so.linkedin, label: "LinkedIn", Icon: LinkedIn },
    { href: so.instagram, label: "Instagram", Icon: Instagram },
    { href: so.facebook, label: "Facebook", Icon: Facebook },
    { href: so.tiktok, label: "TikTok", Icon: TikTok },
    { href: so.x, label: "X", Icon: XLogo },
    { href: so.youtube, label: "YouTube", Icon: YouTube },
  ].filter((x) => x.href);
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <svg aria-hidden className="pointer-events-none absolute -right-40 -top-24 w-[900px] opacity-[0.07]" viewBox="0 0 900 400" fill="none">
        <ellipse cx="450" cy="200" rx="430" ry="150" transform="rotate(-12 450 200)" stroke="white" strokeWidth="3" />
      </svg>
      <div className="container-x relative grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-5">
          <Logo tone="light" className="h-10 w-auto" />
          <p className="mt-5 max-w-sm text-white/70">
            Expert research guidance, practical training and personalised support, from your first idea to publication.
          </p>
          <div className="mt-8 max-w-md">
            <p className="mb-3 font-display text-xl">Get webinar and course news</p>
            <NewsletterForm source="footer" />
          </div>
          {socials.length ? (
            <ul className="mt-8 flex flex-wrap items-center gap-2.5">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener"
                    className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-ink"
                  >
                    <Icon size={17} />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="lg:col-span-3">
          <p className="mb-4 font-semibold">Research services</p>
          <ul className="space-y-2.5 text-[0.94rem] text-white/70">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="link-u hover:text-white">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2">
          <p className="mb-4 font-semibold">Explore</p>
          <ul className="space-y-2.5 text-[0.94rem] text-white/70">
            {explore.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-u hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2">
          <p className="mb-4 font-semibold">Talk to us</p>
          <ul className="space-y-3 text-[0.94rem] text-white/70">
            {settings.supportEmail ? (
              <li>
                <a href={`mailto:${settings.supportEmail}`} className="flex items-start gap-2 hover:text-white">
                  <Mail size={17} className="mt-0.5 shrink-0" /> <span className="break-all">{settings.supportEmail}</span>
                </a>
              </li>
            ) : null}
            {settings.phone ? (
              <li>
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-start gap-2 hover:text-white">
                  <Phone size={17} className="mt-0.5 shrink-0" /> {settings.phone}
                </a>
              </li>
            ) : null}
            {settings.whatsapp ? (
              <li>
                <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="flex items-start gap-2 hover:text-white">
                  <WhatsApp size={17} className="mt-0.5 shrink-0" /> WhatsApp
                </a>
              </li>
            ) : null}
            {settings.address ? (
              <li className="flex items-start gap-2">
                <Pin size={17} className="mt-0.5 shrink-0" /> {settings.address}
              </li>
            ) : null}
            <li>
              <Link href="/request-a-service" className="btn btn-primary btn-sm mt-2">
                Request a service
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-start justify-between gap-3 py-6 text-sm text-white/55 sm:flex-row sm:items-center">
          <p>
            © <Year /> Knowledge Space Academy. Research. Insight. Impact.
          </p>
          <ul className="flex flex-wrap items-center gap-5">
            <li>
              <DataSaverToggle />
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">Terms</Link>
            </li>
            <li>
              <Link href="/sitemap.xml" className="hover:text-white">Sitemap</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

async function Year() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
