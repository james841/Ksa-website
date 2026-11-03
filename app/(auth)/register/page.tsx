import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm, RegisterFormWithParams } from "@/components/forms/auth-forms";

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
      <Suspense fallback={<RegisterForm />}>
        <RegisterFormWithParams />
      </Suspense>
    </>
  );
}
