"use client";

import { useActionState } from "react";
import { cancelWebinarRegistration, registerForWebinar } from "@/app/actions/learning";
import { FormAlert, SubmitButton } from "@/components/forms/fields";
import type { ActionState } from "@/lib/validation";

export function RegisterButton({ slug, registered }: { slug: string; registered: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(
    async () => (registered ? cancelWebinarRegistration(slug) : registerForWebinar(slug)),
    null,
  );
  return (
    <form action={action} className="space-y-3">
      {registered ? (
        <SubmitButton variant="ghost" className="w-full" pendingText="Cancelling…">
          Cancel my registration
        </SubmitButton>
      ) : (
        <SubmitButton className="w-full py-3.5" pendingText="Saving your place…">
          Register for free
        </SubmitButton>
      )}
      <FormAlert state={state} />
    </form>
  );
}
