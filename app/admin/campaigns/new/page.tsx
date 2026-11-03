import type { Metadata } from "next";
import { asc, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader, Panel } from "@/components/admin/ui";
import { CampaignForm } from "@/components/admin/campaign-form";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "New campaign" };

export default async function NewCampaign() {
  await requirePermission("campaigns");
  const [webinars, courses] = await Promise.all([
    db.select({ id: schema.webinars.id, title: schema.webinars.title }).from(schema.webinars).orderBy(desc(schema.webinars.startsAt)).limit(50),
    db.select({ id: schema.courses.id, title: schema.courses.title }).from(schema.courses).orderBy(asc(schema.courses.title)),
  ]);
  return (
    <>
      <PageHeader back={{ href: "/admin/campaigns", label: "Campaigns" }} title="New campaign" description="Save a draft, send yourself a test, then send or schedule it." />
      <Panel>
        <CampaignForm webinars={webinars} courses={courses} />
      </Panel>
    </>
  );
}
