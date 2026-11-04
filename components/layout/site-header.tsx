import { Suspense } from "react";
import Link from "next/link";
import { DataSaverToggle } from "@/components/ui/data-saver-toggle";
import { getSettings } from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth/session";
import { HeaderClient } from "./header-client";
import { ArrowRight, Mail, Phone, Pin, WhatsApp, Facebook, XLogo, LinkedIn, Instagram, YouTube } from "@/components/ui/icons";

export async function SiteHeader() {
  const settings = await getSettings();
  const s = settings.socials;
  const socials = [
    { href: s.facebook, label: "Facebook", Icon: Facebook },
    { href: s.x, label: "X", Icon: XLogo },
    { href: s.linkedin, label: "LinkedIn", Icon: LinkedIn },
    { href: s.instagram, label: "Instagram", Icon: Instagram },
    { href: s.youtube, label: "YouTube", Icon: YouTube },
  ].filter((x) => x.href);

  return (
    <>
      {settings.announcement.enabled && settings.announcement.text ? (
        <div className="bg-blue text-center text-sm font-medium text-white">
          <div className="container-x py-2">
            {settings.announcement.href ? (
              <Link href={settings.announcement.href} className="link-u">
                {settings.announcement.text}
              </Link>
            ) : (
              settings.announcement.text
            )}
          </div>
        </div>
      ) : null}
      {/*
        Utility bar: one navy strip with the contact details, and a blue block on
        the right for the social links. The deep rounded corners and the colour
        change make it read as a designed band rather than a plain grey strip.
      */}
      <div className="hidden bg-white pt-3 md:block">
        <div className="pl-4 lg:pl-8">
          <div className="flex items-stretch overflow-hidden rounded-l-[1.75rem] bg-ink text-[13px] text-white/85">
            <div className="flex flex-1 flex-wrap items-center gap-x-7 gap-y-1 py-2.5 pl-7 pr-6">
              {settings.phone ? (
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="group flex items-center gap-2 transition-colors hover:text-white">
                  <Phone size={15} className="text-sky transition-colors group-hover:text-white" /> {settings.phone}
                </a>
              ) : null}
              {settings.supportEmail ? (
                <a href={`mailto:${settings.supportEmail}`} className="group flex items-center gap-2 transition-colors hover:text-white">
                  <Mail size={15} className="text-sky transition-colors group-hover:text-white" /> {settings.supportEmail}
                </a>
              ) : null}
              {settings.whatsapp ? (
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener"
                  className="group flex items-center gap-2 transition-colors hover:text-white"
                >
                  <WhatsApp size={15} className="text-sky transition-colors group-hover:text-white" /> WhatsApp us
                </a>
              ) : null}
              {settings.address ? (
                <span className="hidden items-center gap-2 lg:flex">
                  <Pin size={15} className="text-sky" /> {settings.address}
                </span>
              ) : null}
              {!settings.supportEmail && !settings.phone && !settings.whatsapp ? <span>Research. Insight. Impact.</span> : null}
            </div>

            <div className="flex shrink-0 items-center py-2.5 pl-6 pr-7">
              <DataSaverToggle className="text-[13px]" />
            </div>

            {/* The blue block anchors the right end of the bar: social links when there
                are any, otherwise the webinar invitation. */}
            {socials.length ? (
              <ul className="flex shrink-0 items-center gap-1.5 rounded-l-[1.75rem] bg-blue py-2.5 pl-7 pr-8">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noopener"
                      className="grid size-7 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-blue"
                    >
                      <Icon size={15} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <Link
                href="/webinars"
                className="group flex shrink-0 items-center gap-2 rounded-l-[1.75rem] bg-blue py-2.5 pl-7 pr-8 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Free monthly webinars
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
      <HeaderClient
        account={
          <Suspense fallback={<AccountLinks user={null} />}>
            <Account />
          </Suspense>
        }
        mobileAccount={
          <Suspense fallback={<AccountLinks user={null} mobile />}>
            <Account mobile />
          </Suspense>
        }
      />
    </>
  );
}

async function Account({ mobile = false }: { mobile?: boolean }) {
  const user = await getCurrentUser();
  return <AccountLinks user={user} mobile={mobile} />;
}

function AccountLinks({ user, mobile = false }: { user: { name: string; role: string } | null; mobile?: boolean }) {
  const cls = mobile ? "btn btn-ghost w-full" : "btn btn-sm text-ink hover:bg-mist px-3";
  if (!user) {
    return (
      <Link href="/login" className={cls}>
        Log in
      </Link>
    );
  }
  return (
    <Link href={user.role === "admin" ? "/admin" : "/dashboard"} className={cls}>
      <span className="grid size-7 place-items-center rounded-full bg-blue text-xs font-bold text-white">
        {user.name.slice(0, 1).toUpperCase()}
      </span>
      {user.role === "admin" ? "Admin" : "My dashboard"}
    </Link>
  );
}
