import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/legal";

export const metadata: Metadata = { title: "Terms of Use", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" path="/terms">
      <p>By creating an account or using this website you agree to these terms.</p>
      <h2>Academic integrity</h2>
      <p>KSA provides academic support and guidance. We help you develop, refine and improve your own work. You remain the author of your research and are responsible for meeting your institution&apos;s rules on originality and acknowledgement.</p>
      <h2>Your account</h2>
      <p>Keep your password private. You are responsible for activity on your account. We may suspend accounts that misuse the website or share paid course content.</p>
      <h2>Course and webinar content</h2>
      <p>Course videos, documents and webinar materials belong to KSA or its instructors. They are for your personal learning only and may not be copied, recorded, shared or resold.</p>
      <h2>Quotes and services</h2>
      <p>A quote is an estimate based on the information you provide. The final scope, timeline and fee for any service are confirmed with you before work begins.</p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. The latest version will always be on this page.</p>
    </LegalPage>
  );
}
