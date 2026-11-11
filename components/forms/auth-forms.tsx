"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login, register, requestPasswordReset, resetPassword } from "@/app/actions/auth";
import { Checkbox, Field, FormAlert, SubmitButton } from "./fields";
import { marketingConsentText } from "@/lib/content";

function useNext() {
  return useSearchParams().get("next") ?? "";
}

export function LoginFormWithParams() {
  const params = useSearchParams();
  return <LoginForm next={useNext()} timedOut={params.get("timeout") === "1"} />;
}
export function LoginForm({ next = "", timedOut = false }: { next?: string; timedOut?: boolean }) {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="space-y-5" noValidate>
      <input suppressHydrationWarning type="hidden" name="next" value={next} />
      {/* Says why they are back here, instead of leaving them to wonder. */}
      {timedOut && !state ? (
        <p role="status" className="rounded-xl bg-mist px-4 py-3 text-sm text-ink">
          You were signed out because nothing happened for a while. Log in to pick up where you left off.
        </p>
      ) : null}
      <Field label="Email address" name="email" type="email" autoComplete="email" required defaultValue={state?.data?.email} error={state?.errors?.email} />
      <div>
        <Field label="Password" name="password" type="password" autoComplete="current-password" required error={state?.errors?.password} />
        <Link href="/forgot-password" className="mt-2 inline-block text-sm font-medium text-blue hover:underline">
          Forgot your password?
        </Link>
      </div>
      <FormAlert state={state && !state.ok ? state : null} />
      <SubmitButton className="w-full py-3.5" pendingText="Logging in…">
        Log in
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        New to KSA?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-blue hover:underline">
          Create a free account
        </Link>
      </p>
    </form>
  );
}

export function RegisterFormWithParams() {
  return <RegisterForm next={useNext()} />;
}
export function RegisterForm({ next = "" }: { next?: string }) {
  const [state, action] = useActionState(register, null);
  const e = state?.errors ?? {};
  const d = state?.data ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <input suppressHydrationWarning type="hidden" name="next" value={next} />
      <Field label="Full name" name="name" autoComplete="name" required defaultValue={d.name} error={e.name} />
      <Field label="Email address" name="email" type="email" autoComplete="email" required defaultValue={d.email} error={e.email} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required error={e.password} hint="At least 8 characters with a letter and a number." />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Country" name="country" autoComplete="country-name" defaultValue={d.country} error={e.country} />
        <Field label="Institution" name="institution" autoComplete="organization" defaultValue={d.institution} error={e.institution} />
      </div>
      <div className="space-y-3 rounded-xl bg-mist p-4">
        <Checkbox name="marketing" label={marketingConsentText} defaultChecked={d.marketing === "on"} />
        <Checkbox
          name="terms"
          required
          defaultChecked={d.terms === "on"}
          error={e.terms}
          label={
            <>
              I agree to the <Link href="/terms" className="underline">terms of use</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
            </>
          }
        />
      </div>
      <FormAlert state={state && !state.ok ? state : null} />
      <SubmitButton className="w-full py-3.5" pendingText="Creating your account…">
        Create my account
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-blue hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, null);
  if (state?.ok) return <FormAlert state={state} />;
  return (
    <form action={action} className="space-y-5" noValidate>
      <Field label="Email address" name="email" type="email" autoComplete="email" required error={state?.errors?.email} />
      <FormAlert state={state && !state.ok ? state : null} />
      <SubmitButton className="w-full py-3.5" pendingText="Sending…">
        Send reset link
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="font-semibold text-blue hover:underline">Back to log in</Link>
      </p>
    </form>
  );
}

export function ResetFormWithParams() {
  const token = useSearchParams().get("token") ?? "";
  return <ResetForm token={token} />;
}
export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, null);
  if (!token) return <FormAlert state={{ ok: false, message: "This link is missing its token. Request a new reset email." }} />;
  return (
    <form action={action} className="space-y-5" noValidate>
      <input suppressHydrationWarning type="hidden" name="token" value={token} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" required error={state?.errors?.password} hint="At least 8 characters with a letter and a number." />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required error={state?.errors?.confirm} />
      <FormAlert state={state && !state.ok ? state : null} />
      <SubmitButton className="w-full py-3.5" pendingText="Saving…">
        Save new password
      </SubmitButton>
    </form>
  );
}
