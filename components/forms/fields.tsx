"use client";

import { useFormStatus } from "react-dom";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Base = { label: string; name: string; error?: string; hint?: ReactNode; className?: string };

export function Field({ label, name, error, hint, className, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = rest.id ?? `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {rest.required ? null : <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      <input suppressHydrationWarning id={id} name={name} className="field" aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...rest} />
      {hint && !error ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      {error ? <p id={`${id}-err`} className="mt-1.5 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function TextArea({ label, name, error, hint, className, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = rest.id ?? `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {rest.required ? null : <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      <textarea suppressHydrationWarning id={id} name={name} className="field min-h-32 resize-y" aria-invalid={!!error} {...rest} />
      {hint && !error ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function Select({
  label,
  name,
  error,
  className,
  options,
  placeholder,
  ...rest
}: Base & SelectHTMLAttributes<HTMLSelectElement> & { options: Array<string | { value: string; label: string }>; placeholder?: string }) {
  const id = rest.id ?? `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {rest.required ? null : <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      <select suppressHydrationWarning id={id} name={name} className="field appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%230b1433%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[right_.8rem_center] bg-no-repeat pr-10" aria-invalid={!!error} {...rest}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => {
          const v = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          );
        })}
      </select>
      {error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function Checkbox({ name, label, error, defaultChecked, required }: { name: string; label: ReactNode; error?: string; defaultChecked?: boolean; required?: boolean }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted">
        <input suppressHydrationWarning type="checkbox" name={name} defaultChecked={defaultChecked} required={required} className="mt-0.5 size-5 shrink-0 accent-blue" />
        <span>{label}</span>
      </label>
      {error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function SubmitButton({ children, pendingText = "Please wait…", className, variant = "primary" }: { children: ReactNode; pendingText?: string; className?: string; variant?: "primary" | "dark" | "light" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <button suppressHydrationWarning type="submit" className={cn("btn", `btn-${variant}`, className)} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormAlert({ state }: { state: { ok: boolean; message?: string } | null }) {
  if (!state?.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn(
        "rounded-xl px-4 py-3 text-sm font-medium",
        state.ok ? "bg-[#e8f5ee] text-success" : "bg-[#fbeceb] text-danger",
      )}
    >
      {state.message}
    </p>
  );
}

/** Invisible field that bots fill in and people never see. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this empty
        <input suppressHydrationWarning type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
