import "server-only";
import { createHash } from "node:crypto";
import { promises as dns } from "node:dns";
import { absoluteUrl, siteUrl } from "@/lib/utils";

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
/* PayFast has been answering 403 on the www validate address for some merchants.
 * api.payfast.co.za serves the same check, so it is tried if www refuses. */
const VALIDATE_FALLBACK = "https://api.payfast.co.za/eng/query/validate";

/**
 * True when the website is running on a computer rather than on a real address.
 *
 * It matters here: PayFast sits behind a firewall that rejects a payment whose
 * return, cancel or notify address points at localhost, and the whole page then
 * comes back as "403 ERROR. The request could not be satisfied." from CloudFront.
 * On a local machine those three fields are therefore left out, so the payment
 * page still opens for a look. PayFast cannot reach a laptop anyway, so no access
 * is granted from a local test: that part has to be tested on the live website.
 */
export function siteIsLocal() {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:|\/|$)/i.test(siteUrl);
}

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
  const local = siteIsLocal();
  // PayFast reads these in the order given, and the signature must use the same order.
  // Empty values are dropped from both the form and the signature, so leaving the
  // three addresses out on a local machine keeps the two in step (see siteIsLocal).
  const fields: Array<[string, string]> = [
    ["merchant_id", merchantId],
    ["merchant_key", merchantKey],
    ["return_url", local ? "" : absoluteUrl(`/courses/${o.courseSlug}?payment=done`)],
    ["cancel_url", local ? "" : absoluteUrl(`/courses/${o.courseSlug}?payment=cancelled`)],
    ["notify_url", local ? "" : absoluteUrl("/api/payfast/notify")],
    ["name_first", (o.firstName ?? "").slice(0, 100)],
    ["email_address", (o.email ?? "").slice(0, 100)],
    ["m_payment_id", o.reference],
    ["amount", randsFromCents(o.amountCents)],
    ["item_name", o.itemName.slice(0, 100)],
    ["item_description", (o.itemDescription ?? "").slice(0, 255)],
  ];
  const sig = signature(fields, passphrase);
  // PayFast ignores blank fields, and the signature above skips them too, so the
  // form must not post them either or the two no longer agree.
  const filled = fields.filter(([, v]) => v !== "");
  return { action: sandbox ? PAYFAST_SANDBOX : PAYFAST_LIVE, fields: [...filled, ["signature", sig] as [string, string]], local };
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

/** A request PayFast's firewall is happy with: form encoded, with a named sender. */
const PAYFAST_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "KnowledgeSpaceAcademy/1.0 (+https://knowledgespaceacademy.com)",
  Accept: "text/plain, */*",
};

/**
 * PayFast confirms the data really came from them.
 *
 * The www address has been answering 403 for some merchants, so api.payfast.co.za
 * is tried next; it runs the same check. A 403 from both is reported as a refusal
 * rather than a pass, so a payment is never granted on a check that did not run.
 */
async function confirmWithPayfast(body: Record<string, string>) {
  const { sandbox } = payfastConfig();
  const urls = sandbox ? [VALIDATE_SANDBOX] : [VALIDATE_LIVE, VALIDATE_FALLBACK];
  const form = new URLSearchParams(body).toString();
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "POST", headers: PAYFAST_HEADERS, body: form });
      const text = (await res.text()).trim();
      if (res.ok && text.startsWith("VALID")) return true;
      console.error(`[payfast] ${url} answered ${res.status}: ${text.slice(0, 120)}`);
    } catch (e) {
      console.error(`[payfast] could not reach ${url}: ${(e as Error).message}`);
    }
  }
  return false;
}

/**
 * Can this server reach PayFast at all? Used by the admin page so a 403 or a
 * blocked network shows up as a plain sentence instead of a failed payment.
 */
export async function checkPayfastReachable(): Promise<{ url: string; status: string }[]> {
  const { sandbox } = payfastConfig();
  const urls = sandbox ? [PAYFAST_SANDBOX, VALIDATE_SANDBOX] : [PAYFAST_LIVE, VALIDATE_LIVE, VALIDATE_FALLBACK];
  return Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { method: "GET", headers: PAYFAST_HEADERS, signal: AbortSignal.timeout(8000) });
        return { url, status: res.status === 403 ? "403 blocked" : `${res.status} ${res.ok ? "reachable" : ""}`.trim() };
      } catch (e) {
        return { url, status: `could not connect (${(e as Error).message})` };
      }
    }),
  );
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
