import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm, RegisterFormWithParams } from "@/components/forms/auth-forms";
import { OAuthButtons } from "@/components/forms/oauth-buttons";
import { googleEnabled } from "@/lib/auth/oauth";

export const metadata: Metadata = {
  title: "Create a free account",
  description: "Create a free Knowledge Space Academy account to register for webinars and take online research courses.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-4xl text-ink">Create your free account</h1>
      <p className="mb-8 mt-2 text-muted">Register for free webinars and access online courses with one login.</p>

      {/* Nothing to type and no new password to remember. Google has already
          verified the address, so these accounts skip the confirmation email. */}
      <div className="mb-6 empty:mb-0">
        <Suspense fallback={null}>
          <OAuthButtons enabled={googleEnabled()} label="Sign up with Google" />
        </Suspense>
      </div>

      <Suspense fallback={<RegisterForm />}>
        <RegisterFormWithParams />
      </Suspense>
    </>
  );
}
