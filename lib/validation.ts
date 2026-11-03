import { z } from "zod";
import { quoteServiceOptions } from "@/lib/content";

export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  data?: Record<string, string>;
} | null;

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function formObject(fd: FormData) {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(200);
const name = z.string().trim().min(2, "Enter your full name.").max(120);
export const passwordRule = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(200)
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

export const quoteSchema = z.object({
  name,
  email,
  country: z.string().trim().min(2, "Enter your country or location.").max(120),
  phone: z.string().trim().min(6, "Enter a phone number we can reach you on.").max(40).regex(/^[+()\d\s-]+$/, "Use digits, spaces, + or - only."),
  service: z.enum(quoteServiceOptions as [string, ...string[]], { message: "Choose the service you need." }),
  description: z.string().trim().min(20, "Tell us a little more (at least 20 characters).").max(5000),
  promoCode: z.string().trim().max(40).optional().or(z.literal("")),
});

export const newsletterSchema = z.object({
  email,
  name: z.string().trim().max(120).optional().or(z.literal("")),
  consent: z.literal("on", { message: "Tick the box to confirm you want to receive our emails." }),
});

export const registerSchema = z.object({
  name,
  email,
  password: passwordRule,
  country: z.string().trim().max(120).optional().or(z.literal("")),
  institution: z.string().trim().max(160).optional().or(z.literal("")),
  marketing: z.string().optional(),
  terms: z.literal("on", { message: "You need to accept the terms to create an account." }),
});

export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password.").max(200) });
export const emailOnlySchema = z.object({ email });
