"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/actions/public";
import { FormAlert, Honeypot, SubmitButton } from "./fields";
import { marketingConsentText } from "@/lib/content";

export function NewsletterForm({ source = "footer", tone = "dark" }: { source?: string; tone?: "dark" | "light" }) {
  const [state, action] = useActionState(subscribeNewsletter, null);
  if (state?.ok) return <FormAlert state={state} />;
  const dark = tone === "dark";
  return (
    <form action={action} className="relative space-y-3" noValidate>
      <Honeypot />
      <input suppressHydrationWarning type="hidden" name="source" value={source} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`nl-${source}`} className="sr-only">
          Email address
        </label>
        <input suppressHydrationWarning
          id={`nl-${source}`}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          defaultValue={state?.data?.email}
          className={dark ? "field border-white/15 bg-white/5 text-white placeholder:text-white/50 focus:bg-white/10" : "field"}
        />
        <SubmitButton variant={dark ? "light" : "primary"} pendingText="Saving…">
          Subscribe
        </SubmitButton>
      </div>
      {state?.errors?.email ? <p className={dark ? "text-sm text-red-300" : "text-sm text-danger"}>{state.errors.email}</p> : null}
      <label className={`flex items-start gap-2.5 text-xs leading-relaxed ${dark ? "text-white/60" : "text-muted"}`}>
        <input suppressHydrationWarning type="checkbox" name="consent" className="mt-0.5 size-4 shrink-0 accent-blue" />
        <span>{marketingConsentText}</span>
      </label>
      {state?.errors?.consent ? <p className={dark ? "text-sm text-red-300" : "text-sm text-danger"}>{state.errors.consent}</p> : null}
      {state && !state.ok && state.message ? <FormAlert state={state} /> : null}
    </form>
  );
}
