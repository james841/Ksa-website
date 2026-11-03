"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { FormAlert } from "@/components/forms/fields";
import type { ActionState } from "@/lib/validation";
import { cn, slugify } from "@/lib/utils";
import { Trash } from "@/components/ui/icons";
import { useToast } from "./toast";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/** Next.js signals redirects by throwing; that must not look like an error. */
const isRedirect = (e: unknown) => typeof (e as { digest?: string })?.digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_REDIRECT");

/**
 * Wraps a server action with pending state and a success/error message.
 * Field errors returned by the action are listed under the form.
 */
export function AdminForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  id,
  successTitle = "Saved",
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  id?: string;
  /** Headline of the pop-up shown when the action succeeds. */
  successTitle?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const { success, error } = useToast();
  const announced = useRef<unknown>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
    // One pop-up per result, not one per re-render.
    if (!state || announced.current === state) return;
    announced.current = state;
    if (state.ok) success(successTitle, state.message);
    else if (state.message) error("That did not save", state.message);
  }, [state, resetOnSuccess, success, error, successTitle]);
  const errors = state?.errors ? Object.values(state.errors) : [];
  return (
    <form ref={ref} id={id} action={formAction} className={cn("space-y-5", className)} noValidate={false}>
      {children}
      {errors.length ? (
        <ul role="alert" className="list-disc space-y-1 rounded-xl bg-[#fbeceb] py-3 pl-9 pr-4 text-sm text-danger">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : state?.ok ? null : (
        // Success is shown as a pop-up; failures also stay next to the form.
        <FormAlert state={state} />
      )}
    </form>
  );
}

/**
 * A button that runs a server action after a second "are you sure" click.
 * No browser pop-ups, works on phones.
 */
export function ConfirmAction({
  action,
  label,
  confirmLabel = "Yes, continue",
  tone = "danger",
  hidden,
  className,
  success,
}: {
  action: (fd: FormData) => Promise<void>;
  label: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "dark" | "ghost";
  hidden?: Record<string, string>;
  className?: string;
  /** Pop-up shown when it worked. Leave empty on actions that move to another page. */
  success?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <form
      action={async (fd) => {
        setBusy(true);
        try {
          await action(fd);
          if (success) toast.success(success);
        } catch (e) {
          // A redirect is not a failure: Next.js throws one on purpose.
          if (!isRedirect(e)) toast.error("That did not work", "Please try again.");
          throw e;
        } finally {
          setBusy(false);
          setArmed(false);
        }
      }}
      className={cn("inline-flex", className)}
    >
      {hidden ? Object.entries(hidden).map(([k, v]) => <input suppressHydrationWarning key={k} type="hidden" name={k} value={v} />) : null}
      {armed ? (
        <span className="inline-flex items-center gap-2">
          <button suppressHydrationWarning type="submit" disabled={busy} className={cn("btn btn-sm", tone === "danger" ? "btn-danger" : "btn-dark")}>
            {busy ? "Working…" : confirmLabel}
          </button>
          <button suppressHydrationWarning type="button" className="btn btn-ghost btn-sm" onClick={() => setArmed(false)}>
            Cancel
          </button>
        </span>
      ) : (
        <button suppressHydrationWarning
          type="button"
          onClick={() => setArmed(true)}
          className={cn("btn btn-sm", tone === "danger" ? "btn-ghost text-danger" : tone === "dark" ? "btn-dark" : "btn-ghost")}
        >
          {label}
        </button>
      )}
    </form>
  );
}

/** Simple one-click action button (no confirmation). */
export function ActionButton({
  action,
  children,
  hidden,
  variant = "ghost",
  className,
  success,
}: {
  action: (fd: FormData) => Promise<void>;
  children: ReactNode;
  hidden?: Record<string, string>;
  variant?: "ghost" | "dark" | "primary" | "light";
  className?: string;
  /** Pop-up shown when it worked. */
  success?: string;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <form
      action={async (fd) => {
        setBusy(true);
        try {
          await action(fd);
          if (success) toast.success(success);
        } catch (e) {
          if (!isRedirect(e)) toast.error("That did not work", "Please try again.");
          throw e;
        } finally {
          setBusy(false);
        }
      }}
      className="inline-flex"
    >
      {hidden ? Object.entries(hidden).map(([k, v]) => <input suppressHydrationWarning key={k} type="hidden" name={k} value={v} />) : null}
      <button suppressHydrationWarning type="submit" disabled={busy} aria-busy={busy} className={cn("btn btn-sm", `btn-${variant}`, className)}>
        {busy ? "…" : children}
      </button>
    </form>
  );
}

/** Image picker with instant preview. Keeps the current image unless a new file is chosen or it is removed. */
export function ImageField({
  name,
  label,
  current,
  hint = "JPG, PNG or WebP up to 8MB. It is compressed automatically.",
  aspect = "aspect-[4/3]",
}: {
  name: string;
  label: string;
  current?: string | null;
  hint?: string;
  aspect?: string;
}) {
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [removed, setRemoved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className={cn("relative w-full max-w-56 overflow-hidden rounded-xl border border-line bg-mist", aspect)}>
          {preview ? (
            preview.startsWith("blob:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="size-full object-cover" />
            ) : (
              <Image src={preview} alt="" fill sizes="224px" className="object-cover" />
            )
          ) : (
            <span className="absolute inset-0 grid place-items-center text-xs text-muted">No image</span>
          )}
        </div>
        <div className="space-y-2">
          <input suppressHydrationWarning
            ref={inputRef}
            type="file"
            name={name}
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="block text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setPreview(URL.createObjectURL(f));
                setRemoved(false);
              }
            }}
          />
          <p className="text-xs text-muted">{hint}</p>
          {preview ? (
            <button suppressHydrationWarning
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger"
              onClick={() => {
                setPreview(null);
                setRemoved(true);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <Trash size={14} /> Remove image
            </button>
          ) : null}
          <input suppressHydrationWarning type="hidden" name={`${name}_current`} value={removed ? "" : current ?? ""} />
        </div>
      </div>
    </div>
  );
}

/** Title + slug pair: the slug follows the title until the admin edits it. */
export function TitleSlugFields({ title, slug, titleLabel = "Title", base }: { title?: string; slug?: string; titleLabel?: string; base: string }) {
  const [t, setT] = useState(title ?? "");
  const [s, setS] = useState(slug ?? "");
  const [touched, setTouched] = useState(!!slug);
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="f-title" className="field-label">
          {titleLabel}
        </label>
        <input suppressHydrationWarning
          id="f-title"
          name="title"
          required
          maxLength={200}
          className="field"
          value={t}
          onChange={(e) => {
            setT(e.target.value);
            if (!touched) setS(slugify(e.target.value));
          }}
        />
      </div>
      <div>
        <label htmlFor="f-slug" className="field-label">
          Web address
        </label>
        <div className="flex items-center rounded-[.8rem] border-[1.5px] border-line bg-mist pl-3 focus-within:border-blue">
          <span className="shrink-0 text-sm text-muted">{base}</span>
          <input suppressHydrationWarning
            id="f-slug"
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="w-full min-w-0 bg-transparent px-1 py-3 text-[.95rem] text-ink outline-none"
            value={s}
            onChange={(e) => {
              setTouched(true);
              setS(slugify(e.target.value));
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function MarkdownHint() {
  return (
    <span>
      Formatting: <code>**bold**</code>, <code>*italic*</code>, <code>## Heading</code>, <code>- list item</code>, <code>[link](https://…)</code>
    </span>
  );
}
