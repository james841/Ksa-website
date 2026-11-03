import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetFormWithParams } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPage() {
  return (
    <>
      <h1 className="text-4xl text-ink">Choose a new password</h1>
      <p className="mb-8 mt-2 text-muted">After saving, you will be signed in and signed out everywhere else.</p>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <ResetFormWithParams />
      </Suspense>
    </>
  );
}
