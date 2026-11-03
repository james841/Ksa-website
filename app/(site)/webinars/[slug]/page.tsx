import { connection } from "next/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getWebinarBySlug } from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Cover } from "@/components/ui/cover";
import { LocalTime } from "@/components/ui/local-time";
import { RegisterButton } from "@/components/webinars/register-button";
import { JsonLd } from "@/components/seo/json-ld";
import { markdownToHtml } from "@/lib/email";
import { Calendar, Clock, Globe, Users, Download, CheckCircle } from "@/components/ui/icons";
import { absoluteUrl, siteUrl } from "@/lib/utils";
import { nowMs } from "@/lib/now";

export async function generateMetadata({ params }: PageProps<"/webinars/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const w = await getWebinarBySlug(slug);
  if (!w) return { title: "Webinar not found", robots: { index: false } };
  return {
    title: `${w.title} (Free Webinar)`,
    description: w.summary,
    alternates: { canonical: `/webinars/${w.slug}` },
    openGraph: { type: "article", url: `/webinars/${w.slug}`, title: w.title, description: w.summary, ...(w.coverImage ? { images: [w.coverImage] } : {}) },
  };
}

export default function WebinarPage({ params }: PageProps<"/webinars/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <WebinarDetail params={params} />
    </Suspense>
  );
}

function DetailSkeleton() {
  return (
    <div className="bg-mist">
      <div className="container-x animate-pulse py-24">
        <div className="h-4 w-48 rounded bg-mist-200" />
        <div className="mt-10 h-14 max-w-2xl rounded bg-mist-200" />
        <div className="mt-6 h-5 max-w-xl rounded bg-mist-200" />
      </div>
    </div>
  );
}

async function WebinarDetail({ params }: Pick<PageProps<"/webinars/[slug]">, "params">) {
  const { slug } = await params;
  const w = await getWebinarBySlug(slug);
  if (!w) notFound();
  await connection(); // "past or upcoming" depends on the current time
  const isPast = w.startsAt.getTime() < nowMs() - 2 * 3600_000;
  const end = w.endsAt ?? new Date(w.startsAt.getTime() + 60 * 60_000);
  const minutes = Math.round((end.getTime() - w.startsAt.getTime()) / 60_000);

  return (
    <>
      <section className="paper-grain bg-mist">
        <div className="container-x grid gap-10 pb-16 pt-10 lg:grid-cols-12 lg:pb-20">
          <div className="lg:col-span-7">
            <Breadcrumbs items={[{ name: "Webinars", path: "/webinars" }, { name: w.title, path: `/webinars/${w.slug}` }]} />
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {w.status === "cancelled" ? "Cancelled" : isPast ? "Past webinar" : "Free live webinar"}
            </p>
            <h1 className="mt-3 text-[clamp(2.2rem,5.4vw,3.8rem)] leading-[1.1] text-ink">{w.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{w.summary}</p>
            <ul className="mt-8 grid gap-3 text-ink sm:grid-cols-2">
              <li className="flex items-center gap-2.5"><Calendar size={18} className="text-blue" /><LocalTime iso={w.startsAt.toISOString()} mode="date" /></li>
              <li className="flex items-center gap-2.5"><Clock size={18} className="text-blue" /><LocalTime iso={w.startsAt.toISOString()} mode="time" /> ({minutes} min)</li>
              <li className="flex items-center gap-2.5"><Globe size={18} className="text-blue" /> Online via Zoom</li>
              {w.speakerName ? (
                <li className="flex items-center gap-2.5"><Users size={18} className="text-blue" /> {w.speakerName}{w.speakerTitle ? `, ${w.speakerTitle}` : ""}</li>
              ) : null}
            </ul>
          </div>
          <div className="lg:col-span-5">
            <Cover title={w.title} image={w.coverImage} className="aspect-[4/3] rounded-[1.6rem] shadow-lift" sizes="(max-width:1024px) 92vw, 480px" priority />
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <article className="prose-ksa max-w-none lg:col-span-7" dangerouslySetInnerHTML={{ __html: markdownToHtml(w.description || w.summary) }} />
          <aside className="lg:col-span-5">
            <div className="sticky top-28 rounded-[1.5rem] bg-mist p-7 ring-1 ring-line">
              {w.status === "cancelled" ? (
                <p className="font-semibold text-danger">This webinar has been cancelled.</p>
              ) : isPast ? (
                <p className="text-muted">This session has already taken place. See <Link href="/webinars" className="text-blue underline">upcoming webinars</Link>.</p>
              ) : (
                <>
                  <p className="font-display text-2xl text-ink">Save your free place</p>
                  <p className="mb-6 mt-2 text-sm text-muted">
                    Registration uses your KSA account. The Zoom link is emailed to you and shown in your dashboard.
                  </p>
                  <Suspense fallback={<div className="h-12 animate-pulse rounded-full bg-mist-200" />}>
                    <Registration slug={w.slug} webinarId={w.id} full={!!w.capacity && w.registrations >= w.capacity} />
                  </Suspense>
                  <a href={`/api/webinars/${w.slug}/ics`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue hover:underline">
                    <Download size={16} /> Add to calendar
                  </a>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: w.title,
          description: w.summary,
          startDate: w.startsAt.toISOString(),
          endDate: end.toISOString(),
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          eventStatus: w.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
          location: { "@type": "VirtualLocation", url: absoluteUrl(`/webinars/${w.slug}`) },
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD", availability: "https://schema.org/InStock", url: absoluteUrl(`/webinars/${w.slug}`) },
          organizer: { "@id": `${siteUrl}/#organization`, name: "Knowledge Space Academy", url: siteUrl },
          ...(w.speakerName ? { performer: { "@type": "Person", name: w.speakerName } } : {}),
          ...(w.coverImage ? { image: absoluteUrl(w.coverImage) } : {}),
        }}
      />
    </>
  );
}

async function Registration({ slug, webinarId, full }: { slug: string; webinarId: string; full: boolean }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-3">
        <Link href={`/register?next=${encodeURIComponent(`/webinars/${slug}`)}`} className="btn btn-primary w-full py-3.5">
          Create a free account to register
        </Link>
        <Link href={`/login?next=${encodeURIComponent(`/webinars/${slug}`)}`} className="btn btn-ghost w-full">
          I already have an account
        </Link>
      </div>
    );
  }
  const [reg] = await db
    .select({ id: schema.webinarRegistrations.id })
    .from(schema.webinarRegistrations)
    .where(and(eq(schema.webinarRegistrations.webinarId, webinarId), eq(schema.webinarRegistrations.userId, user.id)))
    .limit(1);
  if (reg) {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 font-semibold text-success">
          <CheckCircle size={20} /> You are registered
        </p>
        <Link href="/dashboard/webinars" className="btn btn-dark w-full">View joining details</Link>
        <RegisterButton slug={slug} registered />
      </div>
    );
  }
  if (full) return <p className="font-semibold text-ink">This webinar is full.</p>;
  return <RegisterButton slug={slug} registered={false} />;
}
