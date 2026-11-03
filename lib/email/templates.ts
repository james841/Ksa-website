import "server-only";
import { absoluteUrl, formatDateTime } from "@/lib/utils";
import { button, emailLayout, escapeHtml, sendEmail } from "./index";

export async function sendVerifyEmail(to: string, name: string, token: string) {
  const url = absoluteUrl(`/verify-email?token=${token}`);
  return sendEmail({
    to,
    subject: "Confirm your Knowledge Space Academy email",
    html: emailLayout({
      title: "Confirm your email",
      preheader: "One click to confirm your account.",
      body: `<h1 style="font-size:24px;margin:0 0 16px">Welcome, ${escapeHtml(name.split(" ")[0])}</h1>
<p>Thanks for creating a Knowledge Space Academy account. Please confirm your email address so we can send you webinar details and course updates.</p>
${button(url, "Confirm my email")}
<p style="font-size:14px;color:#5B6380">This link expires in 48 hours. If you did not create an account, you can ignore this email.</p>`,
    }),
    text: `Confirm your email: ${url}`,
  });
}

export async function sendPasswordReset(to: string, token: string) {
  const url = absoluteUrl(`/reset-password?token=${token}`);
  return sendEmail({
    to,
    subject: "Reset your Knowledge Space Academy password",
    html: emailLayout({
      title: "Reset your password",
      preheader: "Use this link to choose a new password.",
      body: `<h1 style="font-size:24px;margin:0 0 16px">Reset your password</h1>
<p>We received a request to reset your password. Click the button below to choose a new one.</p>
${button(url, "Choose a new password")}
<p style="font-size:14px;color:#5B6380">This link expires in 1 hour. If you did not ask for this, you can ignore this email and your password will stay the same.</p>`,
    }),
    text: `Reset your password: ${url}`,
  });
}

export async function sendWebinarConfirmation(
  to: string,
  name: string,
  w: { title: string; slug: string; startsAt: Date; meetingUrl: string | null; meetingDetails: string | null },
) {
  const when = formatDateTime(w.startsAt);
  const join = w.meetingUrl
    ? `<p><strong>Joining link:</strong> <a href="${w.meetingUrl}" style="color:#2347E0">${escapeHtml(w.meetingUrl)}</a></p>${w.meetingDetails ? `<p>${escapeHtml(w.meetingDetails)}</p>` : ""}`
    : `<p>We will email the Zoom joining link before the session. It will also appear in your dashboard.</p>`;
  return sendEmail({
    to,
    subject: `You're registered: ${w.title}`,
    html: emailLayout({
      title: "Webinar registration confirmed",
      preheader: `${w.title}, ${when}`,
      body: `<h1 style="font-size:24px;margin:0 0 16px">You're registered, ${escapeHtml(name.split(" ")[0])}</h1>
<p>Your place is saved for <strong>${escapeHtml(w.title)}</strong>.</p>
<p><strong>When:</strong> ${when}</p>${join}
${button(absoluteUrl("/dashboard/webinars"), "View my webinars")}`,
    }),
  });
}

export async function sendWebinarUpdate(to: string, subject: string, bodyHtml: string) {
  return sendEmail({ to, subject, html: emailLayout({ title: subject, body: bodyHtml }) });
}

export async function sendQuoteReceipt(to: string, name: string, reference: string, service: string) {
  return sendEmail({
    to,
    subject: `We received your request (${reference})`,
    html: emailLayout({
      title: "Quote request received",
      preheader: "Our team will review your request and reply soon.",
      body: `<h1 style="font-size:24px;margin:0 0 16px">Thank you, ${escapeHtml(name.split(" ")[0])}</h1>
<p>We have received your request for <strong>${escapeHtml(service)}</strong>. Our team will review the details and get back to you with a clear plan of support.</p>
<p>Your reference is <strong>${reference}</strong>. Please quote it if you contact us about this request.</p>`,
    }),
  });
}

export async function sendQuoteReply(to: string, subject: string, message: string) {
  const html = escapeHtml(message).replace(/\n/g, "<br>");
  return sendEmail({ to, subject, html: emailLayout({ title: subject, body: `<p>${html}</p>` }), text: message });
}

export async function sendStaffInvite(to: string, o: { inviter: string; role: string; token: string; hasAccount: boolean }) {
  const url = absoluteUrl(`/invite?token=${o.token}`);
  const next = o.hasAccount
    ? "Log in with this email address and confirm."
    : "Create a free account with this email address (it takes a minute), then confirm.";
  return sendEmail({
    to,
    subject: `${o.inviter} invited you to the Knowledge Space Academy admin team`,
    html: emailLayout({
      title: "You are invited to the admin team",
      preheader: `Your role: ${o.role}.`,
      body: `<h1 style="font-size:24px;margin:0 0 16px">Join the KSA admin team</h1>
<p>${escapeHtml(o.inviter)} has invited you to help manage the Knowledge Space Academy website as <strong>${escapeHtml(o.role)}</strong>.</p>
<p>${next}</p>
${button(url, "Accept the invitation")}
<p style="font-size:14px;color:#5B6380">This link works once and expires in 7 days. It only works for ${escapeHtml(to)}. If you were not expecting this, you can ignore this email.</p>`,
    }),
    text: `${o.inviter} invited you to the KSA admin team as ${o.role}. ${next} Accept: ${url}`,
  });
}

/**
 * One admin alert, written for a single team member. The footer explains why
 * they received it, so nobody wonders whether it was sent to the whole team.
 */
export async function sendTeamAlert(
  to: string,
  a: {
    subject: string;
    headline: string;
    rows?: Array<[string, string]>;
    note?: string | null;
    link: string;
    linkLabel?: string;
    replyTo?: string;
    roleLabel: string;
  },
) {
  const table = (a.rows ?? [])
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 16px 7px 0;color:#5B6380;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:7px 0"><strong>${escapeHtml(v)}</strong></td></tr>`,
    )
    .join("");
  const note = a.note?.trim()
    ? `<p style="white-space:pre-wrap;background:#F4F7FE;padding:16px;border-radius:12px;margin:20px 0 0">${escapeHtml(a.note.trim())}</p>`
    : "";
  return sendEmail({
    to,
    replyTo: a.replyTo,
    subject: a.subject,
    html: emailLayout({
      title: a.subject,
      preheader: a.headline,
      body: `<h1 style="font-size:22px;margin:0 0 6px">${escapeHtml(a.headline)}</h1>
<p style="margin:0 0 18px;color:#5B6380">Knowledge Space Academy admin alert</p>
${table ? `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px">${table}</table>` : ""}
${note}
${button(absoluteUrl(a.link), a.linkLabel ?? "Open in the admin console")}
<p style="font-size:13px;color:#5B6380;margin:0">You are getting this because you are ${escapeHtml(a.roleLabel)} on the KSA admin team. You can turn these emails off on your admin dashboard.</p>`,
    }),
    text: `${a.headline}\n${(a.rows ?? []).map(([k, v]) => `${k}: ${v}`).join("\n")}\n${a.note ?? ""}\n${absoluteUrl(a.link)}`,
  });
}
