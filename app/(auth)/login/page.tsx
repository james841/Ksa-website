import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm, LoginFormWithParams } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: true }, alternates: { canonical: "/login" } };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-4xl text-ink">Welcome back</h1>
      <p className="mb-8 mt-2 text-muted">Log in to manage your webinars, courses and account.</p>
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithParams />
      </Suspense>
    </>
  );
}
