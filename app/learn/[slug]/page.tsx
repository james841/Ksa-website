import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourseForLearner } from "@/lib/data/learning";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export default function LearnIndex({ params }: PageProps<"/learn/[slug]">) {
  return (
    <Suspense fallback={<p className="p-10 text-muted">Opening your course…</p>}>
      <Go params={params} />
    </Suspense>
  );
}

async function Go({ params }: Pick<PageProps<"/learn/[slug]">, "params">) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/learn/${slug}`);
  const data = await getCourseForLearner(slug, user);
  if (!data || !data.hasAccess) redirect(`/courses/${slug}`);
  const target = data.enrollment?.lastLessonId ?? data.ordered.find((l) => !data.completed.has(l.id))?.id ?? data.ordered[0]?.id;
  redirect(target ? `/learn/${slug}/${target}` : `/courses/${slug}`);
  return null;
}
