import Image from "next/image";
import Link from "next/link";
import logoDark from "@/public/brand/logo-dark.png";
import logoLight from "@/public/brand/logo-light.png";

export function Logo({ tone = "dark", className = "h-9 w-auto", priority = false }: { tone?: "dark" | "light"; className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="Knowledge Space Academy home" className="inline-flex shrink-0 items-center">
      <Image
        src={tone === "dark" ? logoDark : logoLight}
        alt="Knowledge Space Academy"
        className={className}
        sizes="220px"
        priority={priority}
      />
    </Link>
  );
}
