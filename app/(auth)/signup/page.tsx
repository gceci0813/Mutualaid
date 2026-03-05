"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Eye, EyeOff, Lock, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function generateAlias(): string {
  const adjectives = [
    "Silent", "Iron", "Brave", "Swift", "Steady", "Bold", "Alert", "Loyal",
    "Vigilant", "Stoic", "Calm", "Sharp",
  ];
  const nouns = [
    "Engine", "Ladder", "Squad", "Unit", "Station", "Watch", "Shield",
    "Badge", "Dispatch", "Medic", "Rescue", "Patrol",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${noun}${num}`;
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [alias] = useState(generateAlias);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { anonymous_alias: alias },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
          <p className="text-slate-500 text-sm mb-4">
            We sent a verification link to <strong className="text-slate-700">{email}</strong>.
            Click it to activate your account.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Your anonymous alias</p>
            <p className="text-lg font-bold text-slate-900">{alias}</p>
            <p className="text-xs text-slate-400 mt-1">This is how you&apos;ll appear to the community</p>
          </div>
          <p className="text-xs text-slate-400">
            Your email is encrypted and never visible to others. Works with ProtonMail, Gmail, and any other provider.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              Mutual<span className="text-red-600">Aid</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create your anonymous account</h1>
          <p className="text-slate-500 text-sm mt-2">
            Your email is only used to verify you&apos;re human. It&apos;s never shown publicly.
          </p>
        </div>

        <div className="card p-8">
          {/* Alias preview */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-6">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Your community alias will be</p>
              <p className="font-bold text-slate-900 text-sm">{alias}</p>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <p className="text-xs text-slate-400 mt-1.5">Encrypted — never visible to others. ProtonMail friendly.</p>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className="input pr-12"
                  placeholder="Minimum 12 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? "Creating account..." : "Create Anonymous Account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-red-600 font-medium hover:text-red-700">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline hover:text-slate-600">Terms</Link> and{" "}
          <Link href="/community-guidelines" className="underline hover:text-slate-600">Community Guidelines</Link>.
        </p>
      </div>
    </div>
  );
}
