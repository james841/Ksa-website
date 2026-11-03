import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyProfile } from "@/lib/data/dashboard";
import { DashCard } from "@/components/dashboard/card";
import { EmailPrefsForm, PasswordForm, ProfileForm, SignOutEverywhere } from "@/components/dashboard/settings-forms";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.5rem] bg-white" />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const me = (await getCurrentUser())!;
  const { user, subscribed } = await getMyProfile(me.id);
  return (
    <div className="space-y-6">
      <h1 className="text-[clamp(2rem,4vw,2.8rem)] text-ink">Account settings</h1>
      <DashCard title="Profile">
        <ProfileForm user={{ name: user.name, email: user.email, country: user.country, institution: user.institution, phone: user.phone }} />
      </DashCard>
      <DashCard title="Email preferences">
        <EmailPrefsForm subscribed={subscribed} />
      </DashCard>
      <DashCard title="Password and security">
        <PasswordForm />
        <div className="mt-6 border-t border-line pt-6">
          <SignOutEverywhere />
        </div>
      </DashCard>
    </div>
  );
}
