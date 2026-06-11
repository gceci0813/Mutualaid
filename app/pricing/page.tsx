import Link from "next/link";
import { CheckCircle, Shield, BarChart2, Briefcase, Star, Mail, Users } from "lucide-react";
import CheckoutButton from "@/components/CheckoutButton";

const INDIVIDUAL_TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    cta: "Get Started",
    ctaHref: "/signup",
    features: [
      "Browse all 79,000+ agencies",
      "Read all reviews & forum posts",
      "Post reviews (verified only)",
      "Community forum access",
      "Job board browsing",
      "Anonymous alias",
    ],
  },
  {
    name: "Premium",
    price: "$4.99",
    period: "/month",
    highlight: true,
    cta: "Upgrade to Premium",
    ctaHref: "/signup?plan=premium",
    checkoutPlan: "premium" as const,
    features: [
      "Everything in Free",
      "Salary analytics — median pay by state & discipline",
      "Advanced filtering & comparison tools",
      "Ad-free experience",
      "Priority review visibility",
      "Salary benchmarking reports",
    ],
  },
];

const EMPLOYER_TIERS = [
  {
    name: "Basic",
    price: "$99",
    period: "/month",
    highlight: false,
    cta: "Claim Your Agency",
    ctaHref: "/agencies",
    features: [
      "Verified agency badge on your profile",
      "Respond to reviews publicly",
      "Review sentiment dashboard",
      "Compare to similar agencies",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$249",
    period: "/month",
    highlight: true,
    cta: "Get Pro",
    ctaHref: "/agencies",
    features: [
      "Everything in Basic",
      "Full analytics — rating trends over time",
      "Recruitment insights",
      "\"Actively Hiring\" badge on all job listings",
      "Priority placement in agency search",
      "Dedicated account manager",
    ],
  },
];

function PricingCard({
  tier,
}: {
  tier: {
    name: string;
    price: string;
    period: string;
    highlight: boolean;
    cta: string;
    ctaHref: string;
    features: string[];
    checkoutPlan?: "premium" | "basic" | "pro";
  };
}) {
  return (
    <div
      className={`card p-7 flex flex-col ${
        tier.highlight
          ? "border-red-500 shadow-lg relative"
          : ""
      }`}
    >
      {tier.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{tier.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-slate-900">{tier.price}</span>
          <span className="text-slate-500 text-sm">{tier.period}</span>
        </div>
      </div>
      <ul className="space-y-2.5 flex-1 mb-6">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      {tier.checkoutPlan ? (
        <CheckoutButton
          plan={tier.checkoutPlan}
          className={tier.highlight ? "btn-primary w-full justify-center" : "btn-secondary w-full justify-center"}
        >
          {tier.cta}
        </CheckoutButton>
      ) : (
        <Link
          href={tier.ctaHref}
          className={tier.highlight ? "btn-primary w-full justify-center" : "btn-secondary w-full justify-center"}
        >
          {tier.cta}
        </Link>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="page-container py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-red-600 text-sm font-medium mb-4">
          <Shield className="w-3.5 h-3.5" />
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
          Plans for first responders<br />and the agencies that employ them
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          MutualAid is free to join and use. Premium plans unlock deeper insights,
          and agency plans let departments own their narrative.
        </p>
      </div>

      {/* Individual plans */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">For First Responders</h2>
          <p className="text-slate-500">Anonymous, always. Your identity is never at risk.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {INDIVIDUAL_TIERS.map((t) => (
            <PricingCard key={t.name} tier={t} />
          ))}
        </div>
      </div>

      {/* Employer plans */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">For Agencies & Departments</h2>
          <p className="text-slate-500">Understand your reputation. Attract the right candidates.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {EMPLOYER_TIERS.map((t) => (
            <PricingCard key={t.name} tier={t} />
          ))}
        </div>
      </div>

      {/* Job board add-on */}
      <div className="max-w-2xl mx-auto mb-16">
        <div className="card p-7 border-amber-200 bg-amber-50/40">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Featured Job Listings</h3>
              <p className="text-slate-500 text-sm mb-4">
                $99 per listing · 30-day featured placement · 3–5× more applicant views
              </p>
              <ul className="space-y-2 mb-5">
                {[
                  "Pinned at the top of all job board search results",
                  "Gold ⭐ Featured badge on your listing",
                  "Available on any plan — no subscription required",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/jobs/post" className="btn-primary">
                Post a Featured Job
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ / trust section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Common Questions</h2>
        <div className="space-y-4">
          {[
            {
              q: "Is MutualAid really anonymous?",
              a: "Yes. Your email is encrypted and never displayed. You're identified only by a randomly generated alias. Even if you verify with a .gov email, that address is permanently deleted after verification — only your domain (e.g. sfpd.gov) is retained.",
              icon: Shield,
            },
            {
              q: "Can my department see who wrote a review?",
              a: "No. Reviews are tied to anonymous aliases, not identities. Even MutualAid admins cannot trace a review back to a specific person.",
              icon: Users,
            },
            {
              q: "How do I claim my agency's profile?",
              a: "Find your agency in our database, click \"Claim This Agency\", and submit your contact info. We verify your role within 1–2 business days and activate your account.",
              icon: BarChart2,
            },
            {
              q: "What does officer verification do?",
              a: "Verified officers get a badge on their reviews and can post to the community forum. Verification is done via .gov email (verify-then-discard — we never keep the email) or a department-issued access code.",
              icon: Mail,
            },
            {
              q: "Do I need a subscription to post a job?",
              a: "No. Any verified officer can post a job listing for free. Featured placement ($99/listing) is an optional add-on available at checkout.",
              icon: Star,
            },
          ].map(({ q, a, icon: Icon }) => (
            <div key={q} className="card p-5">
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 mb-1">{q}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
