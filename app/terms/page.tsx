import Link from "next/link";
import { FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for MutualAid — the anonymous review and community platform for first responders.",
  robots: { index: false },
};

const EFFECTIVE_DATE = "June 11, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Terms of Service</h1>
          <p className="text-slate-500 text-sm">Effective {EFFECTIVE_DATE}</p>
        </div>
      </div>

      <div className="page-container py-10 max-w-3xl">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using MutualAid (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of
            Service. If you do not agree, do not use the Service. We may update these terms from time to
            time; continued use after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="2. The Service">
          <p>
            MutualAid is a platform where public safety professionals can anonymously review their
            employers, discuss workplace topics, and browse job listings. Reviews and forum posts are
            user-generated content and reflect the opinions of their authors — not of MutualAid.
          </p>
        </Section>

        <Section title="3. Eligibility & Accounts">
          <p>
            You must be at least 18 years old to use the Service. Posting reviews, threads, and comments
            requires officer verification. You are responsible for safeguarding your login credentials,
            including your recovery seed phrase — we cannot recover seed-phrase accounts.
          </p>
        </Section>

        <Section title="4. User Content & Conduct">
          <p>You agree NOT to post content that:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Identifies or attempts to identify another user or any private individual (doxxing)</li>
            <li>Contains threats, harassment, or incitement to violence</li>
            <li>Is knowingly false or defamatory</li>
            <li>Discloses confidential law-enforcement information, ongoing investigation details, or any information restricted by law or department policy</li>
            <li>Constitutes spam, advertising, or solicitation</li>
            <li>Infringes any third party&apos;s intellectual property rights</li>
          </ul>
          <p>
            We may remove content and suspend or terminate accounts that violate these rules, at our sole
            discretion, with or without notice.
          </p>
        </Section>

        <Section title="5. Reviews">
          <p>
            Reviews must reflect your genuine personal experience with an agency. One review per agency
            per user. Agencies with claimed profiles may post one official public response per review.
            We do not remove reviews simply because an agency disagrees with them; we remove content only
            when it violates these Terms.
          </p>
        </Section>

        <Section title="6. Anonymity">
          <p>
            We designed the Service to protect your identity: posts display a randomly generated alias,
            and verification emails are discarded after verification. However, anonymity also depends on
            you — do not include identifying details in your own posts. We cannot guarantee anonymity for
            information you choose to disclose in content you write.
          </p>
        </Section>

        <Section title="7. Paid Services">
          <p>
            Premium subscriptions, agency plans, and featured job listings are billed through Stripe.
            Subscriptions renew automatically until cancelled. Fees are non-refundable except where
            required by law. We may change pricing with at least 30 days&apos; notice for existing
            subscribers.
          </p>
        </Section>

        <Section title="8. Intermediary Status">
          <p>
            MutualAid is an interactive computer service. We do not pre-screen user content and are not
            the publisher or speaker of content provided by users. To report content that violates these
            Terms, use the &ldquo;Report&rdquo; button on any review, thread, or comment.
          </p>
        </Section>

        <Section title="9. Disclaimers & Limitation of Liability">
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM
            EXTENT PERMITTED BY LAW, MUTUALAID SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY
            SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            You may delete your account at any time. We may suspend or terminate access for violations of
            these Terms. Sections that by their nature should survive termination (including content
            licenses, disclaimers, and limitations of liability) will survive.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms are governed by the laws of the United States and the state in which MutualAid is
            organized, without regard to conflict-of-law principles.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these Terms? See also our{" "}
            <Link href="/privacy" className="text-red-600 hover:text-red-700 font-medium">Privacy Policy</Link>.
          </p>
        </Section>
      </div>
    </>
  );
}
