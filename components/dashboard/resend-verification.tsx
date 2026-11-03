"use client";

import { useActionState } from "react";
import { resendVerification } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/fields";
import type { ActionState } from "@/lib/validation";

export function ResendVerification() {
  const [state, action] = useActionState<ActionState, FormData>(() => resendVerification(), null);
  if (state?.message) return <p className="text-sm font-medium text-blue">{state.message}</p>;
  return (
    <form action={action}>
      <SubmitButton variant="dark" className="btn-sm" pendingText="Sending…">Resend confirmation email</SubmitButton>
    </form>
  );
}
