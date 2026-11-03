import type { ReactNode } from "react";
import { PageHero } from "./page-hero";

export function LegalPage({ title, path, children }: { title: string; path: string; children: ReactNode }) {
  return (
    <>
      <PageHero crumbs={[{ name: title, path }]} title={title} lead="Last updated when this website launched. Please read alongside any agreement you sign with KSA." />
      <section className="bg-white py-16">
        <div className="container-x">
          <div className="prose-ksa max-w-3xl">{children}</div>
        </div>
      </section>
    </>
  );
}
