import type { Metadata } from "next";
import Image from "next/image";
import { asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { deleteSlide, moveSlide, saveSlide } from "@/app/actions/admin/content";
import { ActionButton, AdminForm, ConfirmAction, ImageField } from "@/components/admin/forms";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/forms/fields";
import { ChevronDown } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Homepage carousel" };

function SlideFields({ slide }: { slide?: typeof schema.homeSlides.$inferSelect }) {
  return (
    <>
      {slide ? <input suppressHydrationWarning type="hidden" name="id" value={slide.id} /> : null}
      <ImageField name="image" label="Card image (portrait works best, about 3:4)" current={slide?.image} aspect="aspect-[3/4]" hint="Compressed to WebP automatically, usually under 120KB." />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Title on the card</span>
          <input suppressHydrationWarning name="title" required defaultValue={slide?.title} className="field" />
        </label>
        <label className="block">
          <span className="field-label">
            Links to <span className="font-normal text-muted">(optional)</span>
          </span>
          <input suppressHydrationWarning name="href" defaultValue={slide?.href ?? ""} placeholder="/services/research-design" className="field" />
        </label>
      </div>
      <label className="block">
        <span className="field-label">
          Alt text / caption <span className="font-normal text-muted">(describes the image for screen readers and Google)</span>
        </span>
        <input suppressHydrationWarning name="caption" defaultValue={slide?.caption ?? ""} className="field" />
      </label>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input suppressHydrationWarning type="checkbox" name="published" defaultChecked={slide?.published ?? true} className="size-5 accent-blue" />
        Show on the homepage
      </label>
    </>
  );
}

export default async function SlidesPage() {
  await requirePermission("content");
  const slides = await db.select().from(schema.homeSlides).orderBy(asc(schema.homeSlides.position));
  return (
    <>
      <PageHeader
        back={{ href: "/admin/content", label: "Site settings" }}
        title="Homepage carousel"
        description="The curved 3D row of cards under the hero. Eight or more cards fill the curve best; fewer are repeated automatically."
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={`Cards (${slides.length})`}>
          <ol className="space-y-3">
            {slides.map((s, i) => (
              <li key={s.id} className="rounded-2xl border border-line">
                <div className="flex items-center gap-4 p-3">
                  <span className="relative h-20 w-15 shrink-0 overflow-hidden rounded-lg bg-ink">
                    <Image src={s.image} alt="" fill sizes="60px" className="object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {i + 1}. {s.title}
                    </p>
                    <p className="truncate text-xs text-muted">{s.href ?? "No link"}</p>
                    {!s.published ? <Badge value="draft" label="Hidden" /> : null}
                  </div>
                  <ActionButton action={moveSlide} hidden={{ id: s.id, dir: "up" }} className="px-2.5" success="Order updated">
                    ↑
                  </ActionButton>
                  <ActionButton action={moveSlide} hidden={{ id: s.id, dir: "down" }} className="px-2.5" success="Order updated">
                    ↓
                  </ActionButton>
                </div>
                <details className="group border-t border-line px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-blue">
                    Edit <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <AdminForm action={saveSlide} className="mt-4" successTitle="Carousel card saved">
                    <SlideFields slide={s} />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <SubmitButton variant="dark">Save card</SubmitButton>
                    </div>
                  </AdminForm>
                  <div className="mt-3 flex justify-end">
                    <ConfirmAction action={deleteSlide} hidden={{ id: s.id }} label="Delete card" confirmLabel="Delete" success="Card deleted" />
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Add a card">
          <AdminForm action={saveSlide} resetOnSuccess successTitle="Carousel card saved">
            <SlideFields />
            <SubmitButton>Add to carousel</SubmitButton>
          </AdminForm>
        </Panel>
      </div>
    </>
  );
}
