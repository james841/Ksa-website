"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import * as m from "motion/react-m";
import { submitQuote } from "@/app/actions/public";
import { quoteServiceOptions } from "@/lib/content";
import { Field, FormAlert, Honeypot, Select, SubmitButton, TextArea } from "./fields";
import { CheckCircle } from "@/components/ui/icons";

export function QuoteFormWithParams() {
  const sp = useSearchParams();
  const service = sp.get("service") ?? "";
  return <QuoteForm defaultService={quoteServiceOptions.includes(service) ? service : ""} />;
}

export function QuoteForm({ defaultService = "" }: { defaultService?: string }) {
  const [state, action] = useActionState(submitQuote, null);

  if (state?.ok) {
    return (
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.5rem] bg-mist p-8 text-center ring-1 ring-line sm:p-12">
        <CheckCircle size={48} className="mx-auto text-blue" />
        <h2 className="mt-5 font-display text-3xl text-ink">Request received</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Thank you. Our team will review your request and get back to you with a clear plan of support. A confirmation has been
          sent to your email.
        </p>
        <p className="mt-6 text-sm text-muted">Your reference</p>
        <p className="font-display text-2xl text-ink">{state.message}</p>
        <Link href="/" className="btn btn-dark mt-8">
          Back to home
        </Link>
      </m.div>
    );
  }

  const e = state?.errors ?? {};
  const d = state?.data ?? {};
  return (
    <form action={action} className="relative grid gap-5 sm:grid-cols-2" noValidate>
      <Honeypot />
      <Field label="Full name" name="name" required autoComplete="name" defaultValue={d.name} error={e.name} />
      <Field label="Email address" name="email" type="email" required autoComplete="email" defaultValue={d.email} error={e.email} />
      <Field label="Country or location" name="country" required autoComplete="country-name" defaultValue={d.country} error={e.country} />
      <Field label="Phone number" name="phone" type="tel" required autoComplete="tel" placeholder="+234 800 000 0000" defaultValue={d.phone} error={e.phone} hint="Include your country code. WhatsApp numbers are welcome." />
      <Select
        className="sm:col-span-2"
        label="Selected service"
        name="service"
        required
        placeholder="Choose a service"
        options={quoteServiceOptions}
        defaultValue={d.service ?? defaultService}
        error={e.service}
      />
      <TextArea
        className="sm:col-span-2"
        label="Description"
        name="description"
        required
        rows={6}
        placeholder="Tell us about your research, the stage you are at, your discipline, your deadline and any guidelines from your institution or journal."
        defaultValue={d.description}
        error={e.description}
      />
      <Field label="Promo code" name="promoCode" defaultValue={d.promoCode} error={e.promoCode} />
      <div className="flex items-end sm:justify-end">
        <SubmitButton className="w-full px-8 py-3.5 sm:w-auto" pendingText="Sending…">
          Send my request
        </SubmitButton>
      </div>
      <div className="sm:col-span-2">
        <FormAlert state={state && !state.ok ? state : null} />
        <p className="mt-3 text-xs text-muted">
          We use these details only to respond to your request. See our <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </div>
    </form>
  );
}
