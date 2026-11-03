"use client";

import { useState } from "react";
import { saveCampaign } from "@/app/actions/admin/campaigns";
import { AdminForm, MarkdownHint } from "@/components/admin/forms";
import { SubmitButton } from "@/components/forms/fields";
import type { EmailCampaign } from "@/lib/db/schema";

type Opt = { id: string; title: string };

export function CampaignForm({ campaign, webinars, courses, disabled }: { campaign?: EmailCampaign; webinars: Opt[]; courses: Opt[]; disabled?: boolean }) {
  const [audience, setAudience] = useState<string>(campaign?.audience ?? "all_subscribers");
  const c = campaign;
  return (
    <AdminForm action={saveCampaign} successTitle="Campaign saved">
      {c ? <input suppressHydrationWarning type="hidden" name="id" value={c.id} /> : null}
      <fieldset disabled={disabled} className="space-y-5 disabled:opacity-70">
        <div>
          <label className="field-label" htmlFor="c-subject">
            Subject line
          </label>
          <input suppressHydrationWarning id="c-subject" name="subject" required maxLength={200} defaultValue={c?.subject} className="field" placeholder="e.g. November webinars: methodology, NVivo and writing" />
        </div>
        <div>
          <label className="field-label" htmlFor="c-pre">
            Preview text <span className="font-normal text-muted">(optional, shown next to the subject in most inboxes)</span>
          </label>
          <input suppressHydrationWarning id="c-pre" name="previewText" maxLength={160} defaultValue={c?.previewText ?? ""} className="field" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="c-aud">
              Send to
            </label>
            <select suppressHydrationWarning id="c-aud" name="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="field">
              <option value="all_subscribers">All subscribers</option>
              <option value="webinar_registrants">Subscribers who registered for a webinar</option>
              <option value="course_learners">Subscribers enrolled in a course</option>
            </select>
          </div>
          {audience === "webinar_registrants" ? (
            <div>
              <label className="field-label" htmlFor="c-web">
                Which webinar
              </label>
              <select suppressHydrationWarning id="c-web" name="webinarId" defaultValue={c?.audienceRefId ?? ""} className="field">
                <option value="">Any webinar</option>
                {webinars.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {audience === "course_learners" ? (
            <div>
              <label className="field-label" htmlFor="c-course">
                Which course
              </label>
              <select suppressHydrationWarning id="c-course" name="courseId" defaultValue={c?.audienceRefId ?? ""} className="field">
                <option value="">Any course</option>
                {courses.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-relaxed text-ink">
          Campaigns only reach people who opted in to marketing emails. Every email includes an unsubscribe link and one-click unsubscribe headers, as Gmail and Yahoo require.
        </p>
        <div>
          <label className="field-label" htmlFor="c-body">
            Email content
          </label>
          <textarea suppressHydrationWarning
            id="c-body"
            name="body"
            required
            defaultValue={c?.body}
            className="field min-h-[22rem] font-mono text-sm leading-relaxed"
            placeholder={"Hello {{first_name}},\n\nThis month we are running three free webinars…\n\n## Upcoming sessions\n- **Writing a critical literature review**, 12 November\n\n[Register free](https://…)\n\nWarm regards,\nKnowledge Space Academy"}
          />
          <p className="mt-1.5 text-xs text-muted">
            <code>{"{{first_name}}"}</code> becomes each person’s first name. <MarkdownHint />
          </p>
        </div>
        {!disabled ? <SubmitButton variant="dark">{c ? "Save draft" : "Create draft"}</SubmitButton> : null}
      </fieldset>
    </AdminForm>
  );
}
