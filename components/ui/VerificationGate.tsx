"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Mail, Lock } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export function VerificationGate({ children }: Props) {
  const [status, setStatus] = useState<"loading" | "verified" | "unverified">("loading");

  useEffect(() => {
    fetch("/api/verify/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStatus(data?.isVerified ? "verified" : "unverified"))
      .catch(() => setStatus("unverified"));
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unverified") {
    return (
      <div className="page-container py-16 max-w-lg">
        <div className="card p-8 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Verification required</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            To keep MutualAid troll-free, only verified first responders can post reviews,
            threads, and comments. Verification takes under a minute and your identity
            stays fully anonymous.
          </p>

          <div className="space-y-3 mb-6">
            <Link
              href="/dashboard/verify-email"
              className="btn-primary w-full justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Verify with .gov / Work Email
            </Link>
            <Link
              href="/dashboard/verify"
              className="btn-secondary w-full justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Use Agency Access Code
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            Your work email is never stored — only your domain (e.g. sfpd.gov) is retained
            after verification.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
