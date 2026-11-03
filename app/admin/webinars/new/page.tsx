import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { WebinarForm } from "@/components/admin/webinar-form";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "New webinar" };

export default async function NewWebinar() {
  await requirePermission("webinars");
  return (
    <>
      <PageHeader back={{ href: "/admin/webinars", label: "Webinars" }} title="New webinar" description="Save as a draft first if you are still confirming the speaker or time." />
      <WebinarForm />
    </>
  );
}
