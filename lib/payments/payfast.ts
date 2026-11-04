import "server-only";
import { createHash } from "node:crypto";
import { promises as dns } from "node:dns";
import { absoluteUrl } from "@/lib/utils";

/*
 * PayFast (South Africa).
 *
 * How a course payment works:
 *   1. The learner presses "Pay with PayFast". We save a payment row as pending
 *      and send them to /checkout/<id>.
 *   2. That page posts a signed form to PayFast and they pay there.
 *   3. PayFast calls /api/payfast/notify behind the scenes (the ITN). We check
 *      the signature, that the call really came from PayFast, that the amount
 *      matches, and ask PayFast to confirm it. Only then is the learner enrolled.
 *   4. The learner is sent back to the course page either way.
 *
 * Step 3 is what counts: a learner who closes the browser after paying still
 * gets access, and nobody can grant themselves access by faking the return URL.
 */

export const PAYFAST_LIVE = "https://www.payfast.co.za/eng/process";
export const PAYFAST_SANDBOX = "https://sandbox.payfast.co.za/eng/process";
const VALIDATE_LIVE = "https://www.payfast.co.za/eng/query/validate";
const VALIDATE_SANDBOX = "https://sandbox.payfast.co.za/eng/query/validate";

/** PayFast's own servers. The ITN must come from one of these. */
const PAYFAST_HOSTS = ["www.payfast.co.za", "sandbox.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"];

export function payfastConfig() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID?.trim() ?? "";
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY?.trim() ?? "";
  const passphrase = process.env.PAYFAST_PASSPHRASE?.trim() ?? "";
  const sandbox = process.env.PAYFAST_SANDBOX === "true";
  return { merchantId, merchantKey, passphrase, sandbox, ready: Boolean(merchantId && merchantKey) };
}

/** True when the website can take card payments. */
export const paymentsEnabled = () => payfastConfig().ready;

export const randsFromCents = (cents: number) => (cents / 100).toFixed(2);
export const formatPrice = (cents: number, currency = "ZAR") =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency, maximumFractionDigits: 2 }).format(cents / 100);

/**
 * PayFast's encoding: spaces become "+", everything else is percent-encoded in
 * upper case. The order of the fields matters, so never sort them.
 */
function encode(value: string) {
  return encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function signature(fields: Array<[string, string]>, passphrase: string) {
  const base = fields
    .filter(([, v]) => v !== "" && v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encode(v)}`)
    .join("&");
  const withPass = passphrase ? `${base}&passphrase=${encode(passphrase)}` : base;
  return createHash("md5").update(withPass).digest("hex");
}

/** The hidden fields for the form that sends the learner to PayFast. */
export function checkoutFields(o: {
  reference: string;
  amountCents: number;
  itemName: string;
  itemDescription?: string;
  firstName?: string;
  email?: string;
  courseSlug: string;
}) {
  const { merchantId, merchantKey, passphrase, sandbox } = payfastConfig();
  // PayFast reads these in the order given, and the signature must use the same order.
  const fields: Array<[string, string]> = [
    ["merchant_id", merchantId],
    ["merchant_key", merchantKey],
    ["return_url", absoluteUrl(`/courses/${o.courseSlug}?payment=done`)],
    ["cancel_url", absoluteUrl(`/courses/${o.courseSlug}?payment=cancelled`)],
    ["notify_url", absoluteUrl("/api/payfast/notify")],
    ["name_first", (o.firstName ?? "").slice(0, 100)],
    ["email_address", (o.email ?? "").slice(0, 100)],
    ["m_payment_id", o.reference],
    ["amount", randsFromCents(o.amountCents)],
    ["item_name", o.itemName.slice(0, 100)],
    ["item_description", (o.itemDescription ?? "").slice(0, 255)],
  ];
  const sig = signature(fields, passphrase);
  return { action: sandbox ? PAYFAST_SANDBOX : PAYFAST_LIVE, fields: [...fields, ["signature", sig] as [string, string]] };
}

/* ───────────────────────── Checking an ITN ───────────────────────── */

/** The signature PayFast sent must match the one we work out from the same fields. */
function itnSignatureMatches(body: Record<string, string>) {
  const { passphrase } = payfastConfig();
  const fields = Object.entries(body).filter(([k]) => k !== "signature") as Array<[string, string]>;
  return signature(fields, passphrase) === body.signature;
}

/** The call must come from one of PayFast's own servers. */
async function fromPayfast(ip: string | null) {
  if (!ip) return false;
  const lists = await Promise.all(
    PAYFAST_HOSTS.map((host) =>
      dns.resolve4(host).catch(() => [] as string[]),
    ),
  );
  return lists.flat().includes(ip);
}

/** PayFast confirms the data really came from them. */
async function confirmWithPayfast(body: Record<string, string>) {
  const { sandbox } = payfastConfig();
  const res = await fetch(sandbox ? VALIDATE_SANDBOX : VALIDATE_LIVE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const text = (await res.text()).trim();
  return text.startsWith("VALID");
}

export type ItnCheck = { ok: true } | { ok: false; reason: string };

/** All four checks. Any failure means the payment is ignored. */
export async function verifyItn(body: Record<string, string>, ip: string | null, expectedCents: number): Promise<ItnCheck> {
  if (!itnSignatureMatches(body)) return { ok: false, reason: "signature does not match" };
  if (!(await fromPayfast(ip))) return { ok: false, reason: `request came from ${ip ?? "an unknown address"}, not PayFast` };
  const paid = Math.round(Number.parseFloat(body.amount_gross ?? "0") * 100);
  if (!Number.isFinite(paid) || Math.abs(paid - expectedCents) > 1) return { ok: false, reason: `amount ${body.amount_gross} does not match ${randsFromCents(expectedCents)}` };
  if (!(await confirmWithPayfast(body))) return { ok: false, reason: "PayFast did not confirm the data" };
  return { ok: true };
}
