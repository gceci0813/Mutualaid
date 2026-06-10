"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle, AlertCircle, Shield, BarChart2, MessageSquare, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Agency } from "@/types";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "$99/mo",
    features: [
      "Verified agency badge on your profile",
      "Respond to reviews publicly",
      "Review sentiment dashboard",
      "How you compare to similar agencies",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$249/mo",
    features: [
      "Everything in Basic",
      "Full analytics — rating trends over time",
      "Recruitment insights (top candidate sources)",
      "\"Actively Hiring\" badge on all job listings",
      "Priority placement in agency search results",
    ],
  },
];

type Params = Promise<{ slug: string }>;

export default function ClaimAgencyPage({ params }: { params: Params }) {
  const { slug } = use(params);

  const [agency, setAgency] = useState<Agency | null>(null);
  const [loadingAgency, setLoadingAgency] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("agencies")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        setAgency(data as Agency | null);
        setLoadingAgency(false);
      });
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agency) return;
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/agencies/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agencyId: agency.id,
        plan: selectedPlan,
        contactName,
        contactEmail,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setDone(true);
  }

  if (loadingAgency) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="page-container py-16 text-center text-slate-500">Agency not found.</div>
    );
  }

  if (done) {
    return (
      <div className="page-container py-16 max-w-lg">
        <div className="card p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Claim Submitted</h1>
          <p className="text-slate-500 text-sm mb-2">
            Your claim for <strong className="text-slate-800">{agency.name}</strong> is under review.
          </p>
          <p className="text-slate-400 text-xs mb-6">
            We&apos;ll reach out to <strong>{contactEmail}</strong> within 1–2 business days to
            verify your role and activate your account.
          </p>
          <Link href={`/agencies/${slug}`} className="btn-primary w-full justify-center">
            Back to Agency
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-10 max-w-2xl">
      <Link
        href={`/agencies/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {agency.name}
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Claiming</p>
          <h1 className="text-xl font-bold text-slate-900">{agency.name}</h1>
          <p className="text-sm text-slate-500">{agency.city}, {agency.state_abbr}</p>
        </div>
      </div>

      {/* What you get */}
      <div className="mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Why claim your agency profile?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: MessageSquare, label: "Respond to reviews", desc: "Post official responses to officer feedback" },
            { icon: BarChart2, label: "Analytics dashboard", desc: "Sentiment trends, score breakdowns, comparisons" },
            { icon: Star, label: "Verified badge", desc: "Stand out to candidates with a trusted badge" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card p-4 text-center">
              <Icon className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Plan selection */}
        <div>
          <label className="label mb-3">Choose a Plan</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`card p-5 text-left transition-all ${
                  selectedPlan === plan.id
                    ? "border-red-500 bg-red-50 shadow-md"
                    : "hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-900">{plan.name}</p>
                    <p className="text-sm text-red-600 font-semibold">{plan.price}</p>
                  </div>
                  {selectedPlan === plan.id && (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <Shield className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="card p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-700">Your Contact Information</p>
          <p className="text-xs text-slate-400">
            We&apos;ll use this to verify your role and set up your account. Not shared publicly.
          </p>
          <div>
            <label className="label" htmlFor="contact-name">Full Name</label>
            <input
              id="contact-name"
              type="text"
              className="input"
              placeholder="Chief John Smith"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="contact-email">Work Email</label>
            <input
              id="contact-email"
              type="email"
              className="input"
              placeholder="jsmith@sfpd.gov"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full justify-center py-3"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Claim Request"}
        </button>

        <p className="text-xs text-slate-400 text-center">
          No payment collected now. We&apos;ll set up billing after verifying your role.
        </p>
      </form>
    </div>
  );
}
