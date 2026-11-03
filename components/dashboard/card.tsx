import Link from "next/link";

export function DashCard({ title, children, action }: { title: string; children: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <section className="rounded-[1.5rem] bg-white p-6 ring-1 ring-line sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {action ? <Link href={action.href} className="text-sm font-semibold text-blue hover:underline">{action.label}</Link> : null}
      </div>
      {children}
    </section>
  );
}
