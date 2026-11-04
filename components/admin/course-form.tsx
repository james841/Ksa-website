import type { Course } from "@/lib/db/schema";
import { saveCourse } from "@/app/actions/admin/courses";
import { AdminForm, ImageField, MarkdownHint, TitleSlugFields } from "@/components/admin/forms";
import { Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/forms/fields";

const categories = ["Getting started", "Research design", "Literature review", "Methodology", "Data collection", "Qualitative analysis", "Quantitative analysis", "Academic writing", "Publishing", "Research skills"];

export function CourseForm({ course }: { course?: Course }) {
  const c = course;
  return (
    <AdminForm action={saveCourse} successTitle="Course saved">
      {c ? <input suppressHydrationWarning type="hidden" name="id" value={c.id} /> : null}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Course page">
            <div className="space-y-5">
              <TitleSlugFields title={c?.title} slug={c?.slug} base="/courses/" titleLabel="Course title" />
              <div>
                <label className="field-label" htmlFor="c-sub">
                  Subtitle <span className="font-normal text-muted">(optional)</span>
                </label>
                <input suppressHydrationWarning id="c-sub" name="subtitle" defaultValue={c?.subtitle ?? ""} className="field" placeholder="e.g. Finding Your Research Topic" />
              </div>
              <div>
                <label className="field-label" htmlFor="c-sum">
                  Short summary
                </label>
                <textarea suppressHydrationWarning id="c-sum" name="summary" required maxLength={600} defaultValue={c?.summary} className="field min-h-24" />
              </div>
              <div>
                <label className="field-label" htmlFor="c-desc">
                  Full description <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea suppressHydrationWarning id="c-desc" name="description" defaultValue={c?.description} className="field min-h-48 font-mono text-sm" />
                <p className="mt-1.5 text-xs text-muted">
                  <MarkdownHint />
                </p>
              </div>
              <div>
                <label className="field-label" htmlFor="c-out">
                  What learners will be able to do <span className="font-normal text-muted">(one per line)</span>
                </label>
                <textarea suppressHydrationWarning id="c-out" name="outcomes" defaultValue={c?.outcomes?.join("\n")} className="field min-h-32" placeholder={"Turn a broad interest into a focused topic\nWrite a clear research problem"} />
              </div>
            </div>
          </Panel>
          <Panel title="Instructor" description="Optional. Shown on the course page.">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="c-in">
                  Name
                </label>
                <input suppressHydrationWarning id="c-in" name="instructorName" defaultValue={c?.instructorName ?? ""} className="field" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="c-ib">
                  Short bio
                </label>
                <textarea suppressHydrationWarning id="c-ib" name="instructorBio" defaultValue={c?.instructorBio ?? ""} className="field min-h-24" />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Publishing and access">
            <div className="space-y-5">
              <div>
                <label className="field-label" htmlFor="c-status">
                  Status
                </label>
                <select suppressHydrationWarning id="c-status" name="status" defaultValue={c?.status ?? "draft"} className="field">
                  <option value="draft">Draft (hidden from the website)</option>
                  <option value="coming_soon">Coming soon (listed, people can ask to be notified)</option>
                  <option value="published">Published (learners can take it)</option>
                  <option value="archived">Archived (hidden, existing learners keep access)</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="c-mode">
                  Who can enrol
                </label>
                <select suppressHydrationWarning id="c-mode" name="enrollmentMode" defaultValue={c?.enrollmentMode ?? "open"} className="field">
                  <option value="open">Anyone with a free account</option>
                  <option value="invite">Only people an admin gives access to</option>
                </select>
                <p className="mt-1.5 text-xs text-muted">Use “invite” for paid or institution-only courses. Grant access from the Learners section below.</p>
              </div>
              <div>
                <label className="field-label" htmlFor="c-price">
                  Price in rand <span className="font-normal text-muted">(0 for a free course)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg text-muted">R</span>
                  <input
                    suppressHydrationWarning
                    id="c-price"
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={c ? (c.priceCents / 100).toFixed(2) : "0"}
                    className="field"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  Set any amount above 0 and the course page shows “Pay R… with PayFast” instead of “Enrol for free”. The learner
                  gets access the moment PayFast confirms the payment. The button only appears once the status above is
                  <strong className="font-semibold"> Published</strong>.
                </p>
              </div>
              <label className="flex items-start gap-3 rounded-xl bg-mist p-4 text-sm">
                <input suppressHydrationWarning type="checkbox" name="lowData" defaultChecked={c?.lowData ?? false} className="mt-0.5 size-5 accent-blue" />
                <span>
                  <strong className="block text-ink">Low data friendly</strong>
                  <span className="text-muted">Tick when every lesson has full text notes or an audio file, so learners can finish without video.</span>
                </span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="c-level">
                    Level
                  </label>
                  <select suppressHydrationWarning id="c-level" name="level" defaultValue={c?.level ?? "all"} className="field">
                    <option value="all">All levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="c-dur">
                    Length
                  </label>
                  <input suppressHydrationWarning id="c-dur" name="durationLabel" defaultValue={c?.durationLabel ?? ""} className="field" placeholder="e.g. 3 hours" />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_96px] gap-4">
                <div>
                  <label className="field-label" htmlFor="c-cat">
                    Category
                  </label>
                  <input suppressHydrationWarning id="c-cat" name="category" list="cat-list" defaultValue={c?.category ?? "Research skills"} className="field" />
                  <datalist id="cat-list">
                    {categories.map((x) => (
                      <option key={x} value={x} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="field-label" htmlFor="c-pos">
                    Order
                  </label>
                  <input suppressHydrationWarning id="c-pos" name="position" type="number" defaultValue={c?.position ?? 0} className="field" />
                </div>
              </div>
            </div>
          </Panel>
          <Panel title="Cover image">
            <ImageField name="coverImage" label="Shown in the catalogue (landscape works best)" current={c?.coverImage} aspect="aspect-[16/10]" />
          </Panel>
          <div className="sticky bottom-4 z-10 rounded-[1.25rem] bg-ink p-3 shadow-xl">
            <SubmitButton className="w-full" pendingText="Saving…">
              {c ? "Save course" : "Create course"}
            </SubmitButton>
          </div>
        </div>
      </div>
    </AdminForm>
  );
}
