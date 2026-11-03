import "server-only";
import { Resend } from "resend";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { absoluteUrl } from "@/lib/utils";

const apiKey = process.env.RESEND_API_KEY;
export const resend = apiKey ? new Resend(apiKey) : null;
export const EMAIL_FROM = process.env.EMAIL_FROM || "Knowledge Space Academy <onboarding@resend.dev>";

export type OutgoingEmail = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

/**
 * Sends one transactional email (account, webinar, quote). When RESEND_API_KEY
 * is not set, the email is printed to the server console so development still works.
 */
export async function sendEmail(msg: OutgoingEmail) {
  if (!resend) {
    console.info(`\n[email:dev] To: ${msg.to}\nSubject: ${msg.subject}\n${msg.text ?? stripHtml(msg.html).slice(0, 600)}\n`);
    return { id: `dev-${Date.now()}`, error: null as string | null };
  }
  const { data, error } = await resend.emails.send({ from: EMAIL_FROM, ...msg });
  if (error) console.error("[email] send failed", error);
  return { id: data?.id ?? null, error: error?.message ?? null };
}

export function stripHtml(html: string) {
  return html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Admin-written formatting (lessons, webinar descriptions, emails) becomes HTML,
 * then only safe tags and https/mailto links are kept. Scripts, event handlers,
 * iframes and javascript: links are always removed, even if pasted in.
 */
export function markdownToHtml(md: string) {
  const html = marked.parse(md, { async: false, gfm: true, breaks: true }) as string;
  return sanitizeHtml(html, {
    allowedTags: ["h1", "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "blockquote", "ul", "ol", "li", "a", "code", "pre", "table", "thead", "tbody", "tr", "th", "td", "img"],
    allowedAttributes: { a: ["href", "title", "rel", "target"], img: ["src", "alt", "title", "width", "height"], th: ["align"], td: ["align"] },
    allowedSchemes: ["https", "http", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: "noopener noreferrer nofollow", ...(attribs.href?.startsWith("http") ? { target: "_blank" } : {}) } }),
    },
  });
}

/** Branded wrapper used by every email. Table layout for email-client support. */
export function emailLayout(opts: { title: string; body: string; preheader?: string; unsubscribeUrl?: string }) {
  const logo = absoluteUrl("/email-logo.png");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;background:#F6F1E6;font-family:Helvetica,Arial,sans-serif;color:#0B1433">
<span style="display:none!important;opacity:0;height:0;width:0;overflow:hidden">${escapeHtml(opts.preheader ?? "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1E6;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0B1433;padding:28px 32px"><img src="${logo}" width="180" alt="Knowledge Space Academy" style="display:block;border:0"></td></tr>
<tr><td style="padding:36px 32px 12px;font-size:16px;line-height:1.65;color:#1A2240">${opts.body}</td></tr>
<tr><td style="padding:12px 32px 32px;font-size:13px;line-height:1.6;color:#5B6380;border-top:1px solid #EEE7D6">
Knowledge Space Academy · Research. Insight. Impact.<br>
<a href="${absoluteUrl("/")}" style="color:#2347E0">${absoluteUrl("/").replace(/^https?:\/\//, "")}</a>
${opts.unsubscribeUrl ? `<br><br>You are receiving this because you opted in to KSA emails. <a href="${opts.unsubscribeUrl}" style="color:#5B6380">Unsubscribe</a>.` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

export function button(href: string, label: string) {
  return `<p style="margin:28px 0"><a href="${href}" style="background:#2347E0;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:600;display:inline-block">${escapeHtml(label)}</a></p>`;
}
