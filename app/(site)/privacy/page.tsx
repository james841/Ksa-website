import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/legal";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" path="/privacy">
      <p>This policy explains what personal information Knowledge Space Academy (KSA) collects through this website and how we use it.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, email address, password (stored only as a secure hash) and optional country and institution.</li>
        <li>Service requests: your name, email, phone number, country, the service you selected, your description and any promo code.</li>
        <li>Learning activity: the webinars you register for, the courses you enrol in and the lessons you complete.</li>
        <li>Email preferences: whether you agreed to receive our emails, when, and where you gave that permission.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To provide your account, webinar places and course access.</li>
        <li>To reply to your service request and plan your support.</li>
        <li>To send essential emails such as password resets and webinar confirmations.</li>
        <li>To send research tips, webinar announcements and course updates, only if you opted in. You can unsubscribe at any time using the link in every email or in your account settings.</li>
      </ul>
      <h2>Sharing</h2>
      <p>We do not sell your information. We use trusted service providers to run this website and send email (for example our hosting and email delivery providers), who process data only on our instructions.</p>
      <h2>Your choices</h2>
      <p>You can update your details and email preferences in your dashboard, or contact us to request a copy of your data or ask us to delete your account.</p>
      <h2>Contact</h2>
      <p>For any privacy question, please use the contact page.</p>
    </LegalPage>
  );
}
