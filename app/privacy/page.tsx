import Link from "next/link";
import { Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for MutualAid — how we protect first responder anonymity and handle your data.",
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

export default function PrivacyPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Effective {EFFECTIVE_DATE}</p>
        </div>
      </div>

      <div className="page-container py-10 max-w-3xl">
        <div className="card p-5 mb-8 border-emerald-100 bg-emerald-50">
          <p className="text-sm text-emerald-800 leading-relaxed">
            <strong>The short version:</strong> we built MutualAid so that even we know as little about
            you as possible. Your posts show an alias, never your name. Verification emails are deleted
            after use. We don&apos;t sell data — to anyone, ever.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Account email</strong> — used for sign-in and account recovery. Encrypted at rest. Never displayed publicly or shared with agencies.</li>
            <li><strong>Anonymous alias</strong> — randomly generated; this is the only identity shown with your content.</li>
            <li><strong>Verification data</strong> — if you verify with a work email, we keep only the <em>domain</em> (e.g. sfpd.gov); the address itself is permanently deleted after verification. Access-code verification stores only which code was redeemed.</li>
            <li><strong>Content you post</strong> — reviews, threads, comments, and job listings.</li>
            <li><strong>Payment data</strong> — handled entirely by Stripe; we never see or store full card numbers. We store a Stripe customer reference and subscription status.</li>
            <li><strong>Technical data</strong> — standard server logs (IP, user agent) retained briefly for security and abuse prevention.</li>
          </ul>
        </Section>

        <Section title="2. What We Do NOT Do">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>We do not sell or rent personal information.</li>
            <li>We do not disclose who wrote a review to agencies, employers, or other users.</li>
            <li>We do not run third-party advertising trackers.</li>
            <li>We do not require your real name — anywhere.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Information">
          <p>
            We use your information to operate the Service: authenticating you, displaying your content
            under your alias, processing payments, preventing abuse, and aggregating anonymized statistics
            (e.g., average salary ratings by state). Aggregate statistics never identify individuals.
          </p>
        </Section>

        <Section title="4. Legal Requests">
          <p>
            We may disclose information when required by valid legal process. Because of our data
            minimization design, the information we hold about authors of specific content is limited.
            Where legally permitted, we will notify affected users of requests for their data.
          </p>
        </Section>

        <Section title="5. Data Security">
          <p>
            We use encryption in transit and at rest, row-level security on all database tables, and
            least-privilege service access. No system is perfectly secure — avoid putting identifying
            details in the content you write.
          </p>
        </Section>

        <Section title="6. Data Retention & Deletion">
          <p>
            Content remains until you delete it or your account. When you delete your account, your
            email and profile are removed; content may be retained in anonymized form (alias only,
            unlinked from any account). Verification emails are deleted immediately after verification —
            we never retain them.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            We use only essential cookies: session authentication and security. No advertising or
            cross-site tracking cookies.
          </p>
        </Section>

        <Section title="8. Children">
          <p>The Service is not directed to anyone under 18, and we do not knowingly collect data from minors.</p>
        </Section>

        <Section title="9. Changes">
          <p>
            We will post any changes to this policy here and update the effective date. Material changes
            will be announced on the platform.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            See also our <Link href="/terms" className="text-red-600 hover:text-red-700 font-medium">Terms of Service</Link>.
          </p>
        </Section>
      </div>
    </>
  );
}
