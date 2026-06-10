"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, CheckCircle, AlertCircle, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

type Step = "email" | "otp" | "done";

export default function VerifyEmailPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifiedDomain, setVerifiedDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEmail, setShowEmail] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/verify/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setStep("otp");
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/verify/email/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setVerifiedDomain(data.domain);
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="page-container py-10 max-w-lg">
        <div className="card p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Verified Officer</h1>
          <p className="text-slate-500 text-sm mb-2">
            Your officer status has been confirmed via
          </p>
          <p className="font-semibold text-red-600 mb-4">{verifiedDomain}</p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">What we stored</p>
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
              Verified domain: <span className="font-mono font-semibold">{verifiedDomain}</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
              Officer status: verified
            </div>
            <div className="flex items-start gap-2 text-xs text-red-500">
              <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Your work email: <span className="font-medium">permanently deleted</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            A <strong className="text-slate-600">✓ Verified Officer</strong> badge now appears on your reviews
            and forum posts. Your identity remains fully anonymous.
          </p>
          <Link href="/dashboard" className="btn-primary w-full justify-center">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-10 max-w-lg">
      <Link
        href="/dashboard/verify"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Verification
      </Link>

      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Verify via Work Email</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === "email" ? "We'll send a one-time code to your official address" : "Enter the code we sent"}
            </p>
          </div>
        </div>

        {/* Privacy callout */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Your privacy is guaranteed
          </p>
          <ul className="space-y-1.5 text-xs text-blue-600">
            <li>• Your work email is used to send the code only — never stored</li>
            <li>• After you confirm, only your domain (e.g. sfpd.gov) is retained</li>
            <li>• Even if subpoenaed, we cannot produce your email — it doesn&apos;t exist in our database</li>
          </ul>
        </div>

        {step === "email" && (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="label" htmlFor="work-email">
                Work / Official Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="work-email"
                  type={showEmail ? "text" : "password"}
                  className="input pl-10 pr-10"
                  placeholder="you@sfpd.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowEmail(!showEmail)}
                  tabIndex={-1}
                >
                  {showEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Accepted: .gov, .mil, .us, and state agency domains
              </p>
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
              disabled={loading || !email.trim()}
            >
              {loading ? "Sending code..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              Code sent — check your work inbox. Your email has not been stored.
            </div>

            <div>
              <label className="label" htmlFor="otp">
                6-Digit Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  className="input pl-10 font-mono tracking-[0.5em] text-center text-lg"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Code expires in 15 minutes.</p>
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
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Confirm & Get Verified"}
            </button>

            <button
              type="button"
              className="w-full text-sm text-slate-500 hover:text-slate-700 text-center"
              onClick={() => { setStep("email"); setOtp(""); setError(""); }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
