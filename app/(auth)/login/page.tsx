"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, AlertCircle, Lock, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function getSafeRedirect(next: string | null): string {
  if (!next) return "/dashboard";
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

function deriveCredentials(phrase: string): { email: string; password: string } {
  const encoded  = btoa(phrase.trim().toLowerCase()).replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  const password = btoa(`mutualaid::seed::${phrase.trim()}`).slice(0, 48);
  return { email: `anon-${encoded}@mutualaid.anon`, password };
}

const TRUST_ITEMS = [
  "Zero personal data collected or retained",
  "Verified officers only — no trolls or outsiders",
  "Your identity stays anonymous forever",
];

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[46%] bg-slate-950 flex-col justify-between p-12 relative overflow-hidden shrink-0">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-red-800/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <Link href="/" className="flex items-center gap-2.5 relative z-10">
        <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-black text-white tracking-tight">
          Mutual<span className="text-red-500">Aid</span>
        </span>
      </Link>

      <div className="relative z-10 space-y-8">
        <div>
          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            Your voice matters.<br />
            <span className="text-slate-400">Your identity doesn&apos;t.</span>
          </h2>
          <p className="text-slate-400 leading-relaxed">
            The anonymous community built by first responders, for first responders. Speak freely about your department — salary, culture, leadership, and more.
          </p>
        </div>

        <div className="space-y-3">
          {TRUST_ITEMS.map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 border-l-2 border-red-500/30 pl-4">
        <p className="text-slate-400 text-sm italic leading-relaxed">
          &ldquo;Finally a place where I can be honest about what&apos;s really going on in my department without fear of retaliation.&rdquo;
        </p>
        <p className="text-slate-600 text-xs mt-2">— Verified Officer, Law Enforcement</p>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeRedirect(searchParams.get("next"));

  const [loginMode, setLoginMode] = useState<"email" | "seed">("email");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) { setError("Invalid email or password."); setLoading(false); return; }
    router.push(next);
    router.refresh();
  }

  async function handleSeedLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!seedPhrase.trim()) return;
    const words = seedPhrase.trim().split(/\s+/);
    if (words.length < 12) { setError("Please enter all 12 words of your seed phrase."); return; }
    setLoading(true);
    setError("");
    const { email: derivedEmail, password: derivedPassword } = deriveCredentials(seedPhrase);
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: derivedEmail, password: derivedPassword });
    if (loginError) { setError("Seed phrase not recognized. Check each word carefully and try again."); setLoading(false); return; }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white min-h-screen">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900">
                Mutual<span className="text-red-600">Aid</span>
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1.5">Sign in to your anonymous account</p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6 gap-1">
            {[
              { value: "email", label: "Email / Password", icon: null },
              { value: "seed",  label: "Seed Phrase",      icon: Lock },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { setLoginMode(value as "email" | "seed"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  loginMode === value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
              </button>
            ))}
          </div>

          {loginMode === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email address</label>
                <input id="email" type="email" className="input" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0" htmlFor="password">Password</label>
                  <Link href="/forgot-password" className="text-xs text-red-600 hover:text-red-700 font-medium">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input id="password" type={showPw ? "text" : "password"} className="input pr-12"
                    placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="current-password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full justify-center py-3 text-base font-bold" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSeedLogin} className="space-y-4">
              <div>
                <label className="label" htmlFor="seed">Your 12-word seed phrase</label>
                <textarea id="seed" className="input resize-none h-28 font-mono text-sm tracking-wide"
                  placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                  value={seedPhrase} onChange={(e) => setSeedPhrase(e.target.value)}
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
                <p className="text-xs text-slate-400 mt-1.5">
                  Enter all 12 words separated by spaces, exactly as you wrote them down.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full justify-center py-3 text-base font-bold" disabled={loading}>
                {loading ? "Signing in..." : "Sign In with Seed Phrase"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-red-600 font-semibold hover:text-red-700">
              Join anonymously
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
