import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { CourseForm } from "@/components/admin/course-form";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "New course" };

export default async function NewCourse() {
  await requirePermission("courses");
  return (
    <>
      <PageHeader back={{ href: "/admin/courses", label: "Courses" }} title="New course" description="Create the course page first. You add modules and lessons on the next screen." />
      <CourseForm />
    </>
  );
}
