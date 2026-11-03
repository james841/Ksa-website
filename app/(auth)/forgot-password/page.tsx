import type { Metadata } from "next";
import { ForgotForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <h1 className="text-4xl text-ink">Forgot your password?</h1>
      <p className="mb-8 mt-2 text-muted">Enter your email and we will send you a link to choose a new one.</p>
      <ForgotForm />
    </>
  );
}
