import { Suspense } from "react";
import Link from "next/link";
import { DataSaverToggle } from "@/components/ui/data-saver-toggle";
import { getSettings } from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth/session";
import { HeaderClient } from "./header-client";
import { Mail, Phone, WhatsApp, Facebook, XLogo, LinkedIn, Instagram, YouTube } from "@/components/ui/icons";

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
      <div className="hidden bg-ink text-[13px] text-white/80 md:block">
        <div className="container-x flex h-10 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {settings.supportEmail ? (
              <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-2 hover:text-white">
                <Mail size={15} /> {settings.supportEmail}
              </a>
            ) : null}
            {settings.phone ? (
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-white">
                <Phone size={15} /> {settings.phone}
              </a>
            ) : null}
            {settings.whatsapp ? (
              <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} className="flex items-center gap-2 hover:text-white" target="_blank" rel="noopener">
                <WhatsApp size={15} /> WhatsApp us
              </a>
            ) : null}
            {!settings.supportEmail && !settings.phone && !settings.whatsapp ? <span>Research. Insight. Impact.</span> : null}
          </div>
          <div className="flex items-center gap-5">
            <DataSaverToggle className="text-[13px]" />
            <span className="h-4 w-px bg-white/20" aria-hidden />
            <Link href="/webinars" className="font-medium text-white hover:text-blue-100">
              Free monthly webinars
            </Link>
            {socials.length ? <span className="h-4 w-px bg-white/20" aria-hidden /> : null}
            <ul className="flex items-center gap-3">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a href={href} aria-label={label} target="_blank" rel="noopener" className="grid size-6 place-items-center rounded-full hover:text-white">
                    <Icon size={14} />
                  </a>
                </li>
              ))}
            </ul>
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
