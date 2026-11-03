import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LearnLayout({ children }: LayoutProps<"/learn">) {
  return <div className="min-h-dvh bg-mist">{children}</div>;
}
