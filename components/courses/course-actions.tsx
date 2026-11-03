"use client";

import { useActionState } from "react";
import { enrollInCourse, notifyMeAboutCourse } from "@/app/actions/learning";
import { FormAlert, SubmitButton } from "@/components/forms/fields";
import type { ActionState } from "@/lib/validation";

export function EnrollButton({ slug }: { slug: string }) {
  return (
    <form action={enrollInCourse.bind(null, slug)}>
      <SubmitButton className="w-full py-3.5" pendingText="Enrolling…">
        Enrol for free
      </SubmitButton>
    </form>
  );
}

export function NotifyButton({ slug, already }: { slug: string; already: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(() => notifyMeAboutCourse(slug), null);
  if (already || state?.ok) return <FormAlert state={{ ok: true, message: state?.message ?? "You're on the list. We will email you when this course opens." }} />;
  return (
    <form action={action} className="space-y-3">
      <SubmitButton className="w-full py-3.5" pendingText="Saving…">
        Notify me when it opens
      </SubmitButton>
      <FormAlert state={state} />
    </form>
  );
}
