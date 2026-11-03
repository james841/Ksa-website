import type { Webinar } from "@/lib/db/schema";
import { saveWebinar } from "@/app/actions/admin/webinars";
import { AdminForm, ImageField, MarkdownHint, TitleSlugFields } from "@/components/admin/forms";
import { Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/forms/fields";
import { dateToLocalInput } from "@/lib/time";

export function WebinarForm({ webinar }: { webinar?: Webinar }) {
  const w = webinar;
  return (
    <AdminForm action={saveWebinar} successTitle="Webinar saved">
      {w ? <input suppressHydrationWarning type="hidden" name="id" value={w.id} /> : null}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <div className="space-y-5">
              <TitleSlugFields title={w?.title} slug={w?.slug} base="/webinars/" />
              <div>
                <label className="field-label" htmlFor="w-summary">
                  Short summary
                </label>
                <textarea suppressHydrationWarning id="w-summary" name="summary" required maxLength={400} defaultValue={w?.summary} className="field min-h-20" placeholder="One or two sentences shown on webinar cards and in Google results." />
              </div>
              <div>
                <label className="field-label" htmlFor="w-desc">
                  Full description <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea suppressHydrationWarning id="w-desc" name="description" defaultValue={w?.description} className="field min-h-56 font-mono text-sm" placeholder={"## What you will learn\n- …\n\n## Who it is for\n…"} />
                <p className="mt-1.5 text-xs text-muted">
                  <MarkdownHint />
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="w-sn">
                    Speaker name <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input suppressHydrationWarning id="w-sn" name="speakerName" defaultValue={w?.speakerName ?? ""} className="field" />
                </div>
                <div>
                  <label className="field-label" htmlFor="w-st">
                    Speaker role <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input suppressHydrationWarning id="w-st" name="speakerTitle" defaultValue={w?.speakerTitle ?? ""} className="field" placeholder="e.g. Senior Lecturer, University of Johannesburg" />
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Joining details" description="Only shown to registered people (in their dashboard and confirmation email). Never on the public page.">
            <div className="space-y-5">
              <div>
                <label className="field-label" htmlFor="w-url">
                  Zoom or meeting link <span className="font-normal text-muted">(add any time before the session)</span>
                </label>
                <input suppressHydrationWarning id="w-url" name="meetingUrl" type="url" defaultValue={w?.meetingUrl ?? ""} className="field" placeholder="https://zoom.us/j/…" />
              </div>
              <div>
                <label className="field-label" htmlFor="w-md">
                  Meeting ID, passcode or other instructions <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea suppressHydrationWarning id="w-md" name="meetingDetails" defaultValue={w?.meetingDetails ?? ""} className="field min-h-20" />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Schedule and visibility">
            <div className="space-y-5">
              <div>
                <label className="field-label" htmlFor="w-status">
                  Status
                </label>
                <select suppressHydrationWarning id="w-status" name="status" defaultValue={w?.status ?? "draft"} className="field">
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published (open for registration)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="w-start">
                  Starts
                </label>
                <input suppressHydrationWarning id="w-start" name="startsAt" type="datetime-local" required defaultValue={dateToLocalInput(w?.startsAt)} className="field" />
              </div>
              <div>
                <label className="field-label" htmlFor="w-end">
                  Ends <span className="font-normal text-muted">(optional)</span>
                </label>
                <input suppressHydrationWarning id="w-end" name="endsAt" type="datetime-local" defaultValue={dateToLocalInput(w?.endsAt)} className="field" />
                <p className="mt-1.5 text-xs text-muted">Enter times in Lagos time (WAT). Visitors see them converted to their own time zone.</p>
              </div>
              <div>
                <label className="field-label" htmlFor="w-cap">
                  Place limit <span className="font-normal text-muted">(optional)</span>
                </label>
                <input suppressHydrationWarning id="w-cap" name="capacity" type="number" min={1} defaultValue={w?.capacity ?? ""} className="field" placeholder="Leave empty for no limit" />
              </div>
            </div>
          </Panel>
          <Panel title="Cover image">
            <ImageField name="coverImage" label="Shown on the webinar page and when shared on social media" current={w?.coverImage} aspect="aspect-[16/9]" />
          </Panel>
          <div className="sticky bottom-4 z-10 rounded-[1.25rem] bg-ink p-3 shadow-xl">
            <SubmitButton className="w-full" pendingText="Saving…">
              {w ? "Save changes" : "Create webinar"}
            </SubmitButton>
          </div>
        </div>
      </div>
    </AdminForm>
  );
}
