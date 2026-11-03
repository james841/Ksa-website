import Image from "next/image";
import { Logo } from "@/components/layout/logo";
import art from "@/public/images/services/proposal-blue.webp";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <Logo className="h-9 w-auto" priority />
        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          {children}
        </main>
        <p className="text-xs text-muted">© Knowledge Space Academy. Research. Insight. Impact.</p>
      </div>
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <Image src={art} alt="" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="absolute inset-x-8 bottom-8 rounded-[1.75rem] bg-ink/92 p-10 text-white">
          <p className="font-display text-3xl leading-snug">One account for free webinars, online courses and your learning progress.</p>
          <p className="mt-3 text-white/70">Register once and use the same login for everything KSA offers.</p>
        </div>
      </aside>
    </div>
  );
}
