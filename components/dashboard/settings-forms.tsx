"use client";

import { useActionState } from "react";
import { changePassword, signOutEverywhere, updateEmailPreferences, updateProfile } from "@/app/actions/learning";
import { Checkbox, Field, FormAlert, SubmitButton } from "@/components/forms/fields";
import { marketingConsentText } from "@/lib/content";

type Profile = { name: string; email: string; country: string | null; institution: string | null; phone: string | null };

export function ProfileForm({ user }: { user: Profile }) {
  const [state, action] = useActionState(updateProfile, null);
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <Field label="Full name" name="name" required defaultValue={user.name} error={state?.errors?.name} />
      <Field label="Email address" name="email" disabled defaultValue={user.email} hint="Contact us if you need to change your email." />
      <Field label="Country" name="country" defaultValue={user.country ?? ""} />
      <Field label="Institution" name="institution" defaultValue={user.institution ?? ""} />
      <Field label="Phone" name="phone" type="tel" defaultValue={user.phone ?? ""} />
      <div className="flex items-end justify-end gap-3 sm:col-span-2">
        <FormAlert state={state} />
        <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <Field label="Current password" name="current" type="password" autoComplete="current-password" required error={state?.errors?.current} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" required error={state?.errors?.password} hint="At least 8 characters with a letter and a number." />
      <div className="flex items-end justify-end gap-3 sm:col-span-2">
        <FormAlert state={state?.message ? state : null} />
        <SubmitButton pendingText="Saving…">Change password</SubmitButton>
      </div>
    </form>
  );
}

export function EmailPrefsForm({ subscribed }: { subscribed: boolean }) {
  const [state, action] = useActionState(updateEmailPreferences, null);
  return (
    <form action={action} className="space-y-4">
      <Checkbox name="marketing" defaultChecked={subscribed} label={marketingConsentText} />
      <p className="text-xs text-muted">Essential emails, such as password resets and webinar confirmations, are always sent.</p>
      <div className="flex items-center justify-end gap-3">
        <FormAlert state={state} />
        <SubmitButton pendingText="Saving…">Save preferences</SubmitButton>
      </div>
    </form>
  );
}

export function SignOutEverywhere() {
  return (
    <form action={signOutEverywhere}>
      <SubmitButton variant="ghost" pendingText="Signing out…">Sign out on all devices</SubmitButton>
    </form>
  );
}
