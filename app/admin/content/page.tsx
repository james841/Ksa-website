import type { Metadata } from "next";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { defaultSettings, type SiteSettings } from "@/lib/settings-types";
import { saveSettings } from "@/app/actions/admin/content";
import { AdminForm, ImageField } from "@/components/admin/forms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/forms/fields";
import { ArrowRight } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Site settings" };

function F({ name, label, value, type = "text", placeholder, hint }: { name: string; label: string; value: string; type?: string; placeholder?: string; hint?: string }) {
  return (
    <div>
      <label className="field-label" htmlFor={`s-${name}`}>
        {label}
      </label>
      <input suppressHydrationWarning id={`s-${name}`} name={name} type={type} defaultValue={value} placeholder={placeholder} className="field" />
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export default async function SettingsPage() {
  await requirePermission("content");
  const rows = await db.select().from(schema.siteSettings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const s: SiteSettings = {
    ...defaultSettings,
    ...map,
    socials: { ...defaultSettings.socials, ...((map.socials as object) ?? {}) },
    announcement: { ...defaultSettings.announcement, ...((map.announcement as object) ?? {}) },
  } as SiteSettings;

  const shortcuts = [
    { href: "/admin/content/slides", title: "Homepage carousel", text: "The curved row of cards under the hero." },
    { href: "/admin/content/faqs", title: "FAQs", text: "Questions on the FAQ page and homepage." },
    { href: "/admin/content/board", title: "Advisory board", text: "Names, institutions and photos." },
  ];

  return (
    <>
      <PageHeader title="Site settings" description="Contact details, social links and the announcement bar. Changes appear on the website straight away." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {shortcuts.map((x) => (
          <Link key={x.href} href={x.href} className="group rounded-[1.25rem] border border-line bg-white p-5 hover:border-ink">
            <p className="flex items-center justify-between font-semibold">
              {x.title} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </p>
            <p className="mt-1 text-sm text-muted">{x.text}</p>
          </Link>
        ))}
      </div>
      <AdminForm action={saveSettings} successTitle="Settings saved">
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Contact details" description="Shown in the header, footer and contact page. Leave a field empty to hide it.">
            <div className="space-y-5">
              <F name="supportEmail" label="Support email" type="email" value={s.supportEmail} placeholder="hello@knowledgespaceacademy.com" />
              <F name="phone" label="Phone" value={s.phone} placeholder="+234 …" />
              <F name="whatsapp" label="WhatsApp number" value={s.whatsapp} placeholder="+2348012345678" hint="International format. Adds a WhatsApp chat button." />
              <F name="address" label="Address or location" value={s.address} placeholder="e.g. Johannesburg, South Africa and Ibadan, Nigeria" />
            </div>
          </Panel>
          <Panel title="Social media" description="Full links, e.g. https://www.linkedin.com/company/…">
            <div className="space-y-5">
              <F name="facebook" label="Facebook" type="url" value={s.socials.facebook} />
              <F name="x" label="X (Twitter)" type="url" value={s.socials.x} />
              <F name="linkedin" label="LinkedIn" type="url" value={s.socials.linkedin} />
              <F name="instagram" label="Instagram" type="url" value={s.socials.instagram} />
              <F name="youtube" label="YouTube" type="url" value={s.socials.youtube} />
            </div>
          </Panel>
          <Panel title="Alerts email" description="Where a copy of every admin alert is sent: new quote requests, registrations, enrolments, subscribers and campaign results.">
            <F
              name="notifyEmail"
              label="General alerts email"
              type="email"
              value={s.notifyEmail}
              placeholder="admin@knowledgespaceacademy.com"
              hint="Team members are also emailed about their own sections only. Leave empty to use the ADMIN_NOTIFY_EMAIL value in the .env file."
            />
          </Panel>
          <Panel title="Announcement bar" description="A thin blue bar above the menu on every page. Good for a webinar this week or a deadline.">
            <div className="space-y-5">
              <label className="flex items-center gap-3 text-sm font-medium">
                <input suppressHydrationWarning type="checkbox" name="announcementEnabled" defaultChecked={s.announcement.enabled} className="size-5 accent-blue" />
                Show the announcement bar
              </label>
              <F name="announcementText" label="Text" value={s.announcement.text} placeholder="Free webinar on Thursday: writing a strong literature review" />
              <F name="announcementHref" label="Link (optional)" value={s.announcement.href} placeholder="/webinars" />
            </div>
          </Panel>
          <Panel title="Homepage" description="The top section of the homepage.">
            <div className="space-y-5">
              <F name="heroBadge" label="Small badge above the main headline" value={s.heroBadge} hint="Keep it short, under 50 characters." />
              <ImageField
                name="heroImage"
                label="Background photo"
                current={s.heroImage || null}
                aspect="aspect-[16/9]"
                hint="A wide photo (landscape, at least 1920px wide). A dark blue layer is placed over it so the text stays easy to read. Remove it to go back to the default campus photo."
              />
            </div>
          </Panel>
        </div>
        <div className="sticky bottom-4 z-10 flex justify-end">
          <div className="rounded-full bg-ink p-2 shadow-xl">
            <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
          </div>
        </div>
      </AdminForm>
    </>
  );
}
