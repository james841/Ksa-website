"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { DataSaverToggle } from "@/components/ui/data-saver-toggle";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, useMotionValueEvent, useScroll } from "motion/react";
import * as m from "motion/react-m";
import { Logo } from "./logo";
import { mainNav, serviceLinks, institutionLinks } from "@/lib/nav";
import { ArrowRight, ChevronDown, Menu, X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import topicArt from "@/public/images/services/topic-blue.webp";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeaderClient({ account, mobileAccount }: { account: ReactNode; mobileAccount: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { scrollY, scrollYProgress } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled ? "border-line bg-white/85 shadow-[0_10px_30px_-20px_rgba(11,20,51,.35)] backdrop-blur-xl" : "border-transparent bg-white",
      )}
    >
      <m.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-blue"
        style={{ scaleX: scrollYProgress }}
      />
      <div className={cn("container-x flex items-center justify-between gap-6 transition-[height] duration-300", scrolled ? "h-16" : "h-20")}>
        <Logo className={cn("w-auto transition-[height] duration-300", scrolled ? "h-8" : "h-9 sm:h-10")} priority />

        <nav aria-label="Main" className="hidden lg:block">
          <Suspense fallback={<NavList active="" megaOpen={megaOpen} openMega={openMega} closeMega={closeMega} />}>
            <ActiveNavList megaOpen={megaOpen} openMega={openMega} closeMega={closeMega} />
          </Suspense>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">{account}</div>
          <Link href="/request-a-quote" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Request a quote
          </Link>
          <button suppressHydrationWarning
            type="button"
            className="grid size-11 place-items-center rounded-full text-ink hover:bg-mist lg:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Services mega menu */}
      <AnimatePresence>
        {megaOpen ? (
          <m.div
            key="mega"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease }}
            onMouseEnter={openMega}
            onMouseLeave={closeMega}
            className="absolute inset-x-0 top-full hidden border-b border-line bg-white shadow-[0_30px_60px_-30px_rgba(11,20,51,.35)] lg:block"
          >
            <div className="container-x grid grid-cols-12 gap-8 py-8">
              <div className="col-span-7">
                <p className="mb-4 text-sm font-semibold text-muted">Research services</p>
                <ul className="grid grid-cols-2 gap-1">
                  {serviceLinks.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={() => setMegaOpen(false)}
                        className="group block rounded-xl p-3 transition-colors hover:bg-mist"
                      >
                        <span className="flex items-center gap-2 font-semibold text-ink group-hover:text-blue">
                          {l.label}
                        </span>
                        <span className="mt-0.5 block text-sm leading-snug text-muted">{l.text}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2 border-l border-line pl-6">
                <p className="mb-4 text-sm font-semibold text-muted">For institutions</p>
                <ul className="space-y-3">
                  {institutionLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={() => setMegaOpen(false)} className="text-sm font-medium text-ink hover:text-blue">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/webinars"
                onClick={() => setMegaOpen(false)}
                className="group col-span-3 overflow-hidden rounded-2xl bg-ink text-white"
              >
                <Image src={topicArt} alt="" className="h-36 w-full object-cover object-top opacity-90 transition-transform duration-700 group-hover:scale-105" sizes="300px" />
                <div className="p-5">
                  <p className="font-display text-xl">Free monthly webinars</p>
                  <p className="mt-1 text-sm text-white/70">Learn with researchers across the world, live on Zoom.</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-100">
                    See upcoming sessions <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <m.div key="mobile" className="fixed inset-0 z-[60] lg:hidden" initial="closed" animate="open" exit="closed">
            <m.div
              className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
              variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }}
              onClick={() => setMobileOpen(false)}
            />
            <m.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-white"
              variants={{ open: { x: 0 }, closed: { x: "100%" } }}
              transition={{ duration: 0.4, ease }}
            >
              <div className="flex h-20 items-center justify-between px-5">
                <Logo className="h-8 w-auto" />
                <button suppressHydrationWarning type="button" aria-label="Close menu" className="grid size-11 place-items-center rounded-full hover:bg-mist" onClick={() => setMobileOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <MobileNav onNavigate={() => setMobileOpen(false)} />
              <div className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3">
                <span className="text-xs text-muted">Using mobile data? Load lighter pages.</span>
                <DataSaverToggle tone="light" className="shrink-0" />
              </div>
              <div className="mt-auto space-y-3 border-t border-line p-5" onClick={() => setMobileOpen(false)}>
                {mobileAccount}
                <Link href="/request-a-quote" className="btn btn-primary w-full">
                  Request a quote
                </Link>
              </div>
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function ActiveNavList(props: { megaOpen: boolean; openMega: () => void; closeMega: () => void }) {
  const pathname = usePathname();
  return <NavList active={pathname} {...props} />;
}

function NavList({
  active,
  megaOpen,
  openMega,
  closeMega,
}: {
  active: string;
  megaOpen: boolean;
  openMega: () => void;
  closeMega: () => void;
}) {
  return (
    <ul className="flex items-center gap-1">
      {mainNav.map((item) => {
        const isActive = active === item.href || active.startsWith(item.href + "/");
        if ("mega" in item && item.mega) {
          return (
            <li key={item.href} onMouseEnter={openMega} onMouseLeave={closeMega}>
              <Link
                href={item.href}
                aria-expanded={megaOpen}
                onFocus={openMega}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.94rem] font-medium transition-colors hover:text-blue",
                  isActive ? "text-blue" : "text-ink",
                )}
              >
                {item.label}
                <ChevronDown size={16} className={cn("transition-transform duration-200", megaOpen && "rotate-180")} />
              </Link>
            </li>
          );
        }
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onFocus={closeMega}
              className={cn(
                "relative rounded-full px-3.5 py-2 text-[0.94rem] font-medium transition-colors hover:text-blue",
                isActive ? "text-blue" : "text-ink",
              )}
            >
              {item.label}
              {isActive ? <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-blue" /> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const [servicesOpen, setServicesOpen] = useState(false);
  return (
    <nav aria-label="Mobile" className="px-3">
      <ul className="space-y-0.5">
        {mainNav.map((item) =>
          "mega" in item && item.mega ? (
            <li key={item.href}>
              <button suppressHydrationWarning
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-lg font-semibold text-ink"
                aria-expanded={servicesOpen}
                onClick={() => setServicesOpen((v) => !v)}
              >
                {item.label}
                <ChevronDown size={20} className={cn("transition-transform", servicesOpen && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {servicesOpen ? (
                  <m.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease }}
                    className="overflow-hidden pl-3"
                  >
                    <li>
                      <Link href="/services" onClick={onNavigate} className="block rounded-lg px-3 py-2.5 font-medium text-blue">
                        All services
                      </Link>
                    </li>
                    {serviceLinks.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} onClick={onNavigate} className="block rounded-lg px-3 py-2.5 text-muted hover:text-ink">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </m.ul>
                ) : null}
              </AnimatePresence>
            </li>
          ) : (
            <li key={item.href}>
              <Link href={item.href} onClick={onNavigate} className="block rounded-xl px-3 py-3.5 text-lg font-semibold text-ink hover:bg-mist">
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
