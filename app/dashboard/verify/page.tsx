"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, CheckCircle, AlertCircle, ArrowLeft, Lock } from "lucide-react";

export default function VerifyOfficerPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState<{ agencyName: string } | null>(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check current verification status on load
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/verify/status");
        if (res.ok) {
          const data = await res.json();
          if (data.isVerified) {
            setAlreadyVerified(true);
          }
        }
      } finally {
        setCheckingStatus(false);
      }
    }
    checkStatus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setVerified({ agencyName: data.agencyName });
  }

  if (checkingStatus) {
    return (
      <div className="page-container py-10 max-w-lg flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (alreadyVerified) {
    return (
      <div className="page-container py-10 max-w-lg">
        <div className="card p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Already Verified</h1>
          <p className="text-slate-500 text-sm mb-6">
            Your account is already verified as a law enforcement officer. Your reviews display a Verified Officer badge.
          </p>
          <Link href="/dashboard" className="btn-primary justify-center">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="page-container py-10 max-w-lg">
        <div className="card p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Verified Officer
          </h1>
          <p className="text-slate-500 text-sm mb-2">
            You&apos;re now verified as an officer from
          </p>
          <p className="text-lg font-bold text-red-600 mb-4">{verified.agencyName}</p>
          <p className="text-xs text-slate-400 mb-6">
            A <strong className="text-slate-600">✓ Verified Officer</strong> badge will now appear on all your reviews.
            Your identity remains anonymous — only your alias is shown.
          </p>
          <Link href="/agencies" className="btn-primary justify-center">
            Browse Agencies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-10 max-w-lg">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="card p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Verify Officer Status</h1>
            <p className="text-xs text-slate-500 mt-0.5">Enter the access code from your department</p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 space-y-2.5">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">How it works</p>
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-red-600 font-bold text-[10px]">1</span>
            </div>
            Your department contact generates codes and distributes them internally
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-red-600 font-bold text-[10px]">2</span>
            </div>
            Enter your one-time code below — codes are single use
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-red-600 font-bold text-[10px]">3</span>
            </div>
            Your reviews get a{" "}<strong className="text-slate-700">✓ Verified Officer</strong>{" "}badge — your identity stays anonymous
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="code">
              Department Access Code
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="code"
                type="text"
                className="input pl-10 font-mono tracking-widest uppercase"
                placeholder="XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={14}
                required
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Don&apos;t have a code? Ask your department liaison or union rep.
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
            disabled={loading || code.trim().length === 0}
          >
            {loading ? "Verifying..." : "Verify My Badge"}
          </button>
        </form>
      </div>
    </div>
  );
}
