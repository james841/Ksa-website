import type { Metadata } from "next";
import Image from "next/image";
import { asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { deleteBoardMember, moveBoardMember, saveBoardMember } from "@/app/actions/admin/content";
import { ActionButton, AdminForm, ConfirmAction, ImageField } from "@/components/admin/forms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SubmitButton } from "@/components/forms/fields";
import { initials } from "@/lib/utils";
import { ChevronDown } from "@/components/ui/icons";

/*
 * Private page: it is rendered fresh for each signed-in person (the server checks the
 * session and role), so there is no public page for Next.js to prepare in advance.
 * This line tells Next.js that, instead of it warning about "uncached data".
 */
export const instant = false;

export const metadata: Metadata = { title: "Advisory board" };

function MemberFields({ m }: { m?: typeof schema.boardMembers.$inferSelect }) {
  return (
    <>
      {m ? <input suppressHydrationWarning type="hidden" name="id" value={m.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Name with title</span>
          <input suppressHydrationWarning name="name" required defaultValue={m?.name} placeholder="Prof Jane Doe" className="field" />
        </label>
        <label className="block">
          <span className="field-label">Institution</span>
          <input suppressHydrationWarning name="affiliation" required defaultValue={m?.affiliation} className="field" />
        </label>
      </div>
      <ImageField name="photo" label="Photo (optional, square)" current={m?.photo} aspect="aspect-square" hint="Without a photo, their initials are shown." />
    </>
  );
}

export default async function BoardAdmin() {
  await requirePermission("content");
  const members = await db.select().from(schema.boardMembers).orderBy(asc(schema.boardMembers.position));
  return (
    <>
      <PageHeader back={{ href: "/admin/content", label: "Site settings" }} title="Advisory board" description="Shown on the homepage and the publishing page." />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={`Members (${members.length})`}>
          <ol className="space-y-3">
            {members.map((m) => (
              <li key={m.id} className="rounded-2xl border border-line">
                <div className="flex items-center gap-4 p-3">
                  {m.photo ? (
                    <Image src={m.photo} alt="" width={48} height={48} className="size-12 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-12 place-items-center rounded-full bg-ink font-display text-white">{initials(m.name)}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-muted">{m.affiliation}</p>
                  </div>
                  <ActionButton action={moveBoardMember} hidden={{ id: m.id, dir: "up" }} className="px-2.5" success="Order updated">
                    ↑
                  </ActionButton>
                  <ActionButton action={moveBoardMember} hidden={{ id: m.id, dir: "down" }} className="px-2.5" success="Order updated">
                    ↓
                  </ActionButton>
                </div>
                <details className="group border-t border-line px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-blue">
                    Edit <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <AdminForm action={saveBoardMember} className="mt-4" successTitle="Board member saved">
                    <MemberFields m={m} />
                    <SubmitButton variant="dark">Save</SubmitButton>
                  </AdminForm>
                  <div className="mt-3 flex justify-end">
                    <ConfirmAction action={deleteBoardMember} hidden={{ id: m.id }} label="Remove" confirmLabel="Remove member" success="Board member deleted" />
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Add a member">
          <AdminForm action={saveBoardMember} resetOnSuccess successTitle="Board member saved">
            <MemberFields />
            <SubmitButton>Add member</SubmitButton>
          </AdminForm>
        </Panel>
      </div>
    </>
  );
}
