"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield, Eye, EyeOff, Lock, AlertCircle,
  Copy, Check, RefreshCw, CheckCircle, ArrowLeft
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ── Alias generator ──────────────────────────────────────────────────────────
const ADJECTIVES = ["Silent","Iron","Brave","Swift","Steady","Bold","Alert","Loyal","Vigilant","Stoic","Calm","Sharp"];
const NOUNS = ["Engine","Ladder","Squad","Unit","Station","Watch","Shield","Badge","Dispatch","Medic","Rescue","Patrol"];
function generateAlias(): string {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(Math.random() * 900) + 100;
  return `${adj}${noun}${num}`;
}

// ── Seed phrase generator ────────────────────────────────────────────────────
const WORDS = [
  "able","acid","aged","also","area","army","away","baby","back","ball","band","bank",
  "base","bath","bear","beat","been","bell","best","bird","blow","blue","bold","bolt",
  "bond","bone","book","born","both","brow","burn","busy","call","calm","came","camp",
  "card","care","cart","case","cash","cast","cave","cell","chip","city","clan","clay",
  "clip","club","coal","coat","code","coin","cold","come","cool","core","corn","cost",
  "crew","crop","cure","dark","data","date","dawn","dead","deal","dear","deck","deed",
  "deep","deer","dell","desk","dial","dice","diet","dirt","disk","dock","dome","door",
  "dose","dove","down","draw","drop","drum","dual","dull","dune","dusk","dust","duty",
  "each","earn","east","edge","else","epic","even","ever","evil","exam","exit","face",
  "fact","fail","fair","fall","fame","fast","fate","feel","felt","file","fill","film",
  "find","fine","fire","firm","fish","five","flag","flat","flew","flip","flow","foam",
  "fold","folk","fond","font","food","fool","ford","fore","fork","form","fort","four",
  "free","from","fuel","full","fund","fuse","gain","game","gate","gave","gear","gift",
  "give","glad","glow","glue","goal","gold","gone","good","gray","grew","grid","grim",
  "grip","grow","gulf","gust","gyre","hail","half","hall","hand","hang","hard","harm",
  "haze","head","heal","heap","heat","held","helm","help","herb","here","hero","high",
  "hill","hint","hold","hole","home","hook","hope","horn","hour","hunt","hurt","icon",
  "idea","idle","iron","isle","jade","join","jump","just","keen","keep","kind","king",
  "knew","knot","know","lake","land","lane","last","late","lead","leaf","lean","leap",
  "left","life","lift","like","lime","line","link","lion","list","live","load","loft",
  "long","loop","lore","lost","loud","love","luck","lure","made","mail","main","make",
  "mast","maze","meal","meet","melt","mesh","mild","mile","mill","mind","mine","mint",
  "miss","mist","mode","moon","more","most","move","much","myth","nail","name","near",
  "nest","news","next","node","none","noon","norm","note","nova","null","oath","ocean",
];

function generatePhrase(): string {
  const arr = new Uint16Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((n) => WORDS[n % WORDS.length]).join(" ");
}

function deriveCredentials(phrase: string): { email: string; password: string } {
  const encoded  = btoa(phrase.trim().toLowerCase()).replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  const password = btoa(`mutualaid::seed::${phrase.trim()}`).slice(0, 48);
  return { email: `anon-${encoded}@mutualaid.anon`, password };
}

// ── Left panel ───────────────────────────────────────────────────────────────
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
            Join 12,000+ first<br />
            <span className="text-slate-400">responders speaking freely.</span>
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Your alias is randomly generated. No name, no badge number, no department affiliation — just your honest voice.
          </p>
        </div>

        <div className="space-y-3">
          {[
            "Anonymous from day one",
            "Verified officers only — no public access",
            "Seed phrase option — no email ever needed",
          ].map((item) => (
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
          &ldquo;I used the seed phrase option. No email, no trace. Exactly what I needed.&rdquo;
        </p>
        <p className="text-slate-600 text-xs mt-2">— Verified Officer, Fire Department</p>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
type Mode = "choose" | "seed" | "email";

export default function SignupPage() {
  const router = useRouter();
  const [mode, setMode]             = useState<Mode>("choose");
  const [alias]                     = useState(generateAlias);

  // Seed phrase state
  const [phrase, setPhrase]         = useState(generatePhrase);
  const [copied, setCopied]         = useState(false);
  const [confirmed, setConfirmed]   = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedError, setSeedError]   = useState("");

  // Email state
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailDone, setEmailDone]   = useState(false);

  // ── Seed phrase signup ─────────────────────────────────────────────────────
  async function handleSeedSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) return;
    setSeedLoading(true);
    setSeedError("");
    try {
      const res = await fetch("/api/auth/seed-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase, action: "signup", alias }),
      });
      const json = await res.json();
      if (json.unconfigured) {
        setSeedError("Seed phrase signup is not yet configured on this server. Please use email signup or contact support.");
        setSeedLoading(false);
        return;
      }
      if (json.error) { setSeedError(json.error); setSeedLoading(false); return; }
      const supabase = createClient();
      const { email: derivedEmail, password: derivedPassword } = deriveCredentials(phrase);
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: derivedEmail, password: derivedPassword });
      if (loginError) {
        setSeedError("Account created but sign-in failed. Try the login page with your seed phrase.");
        setSeedLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setSeedError("Something went wrong. Please try again.");
      setSeedLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRegenerate() {
    setPhrase(generatePhrase());
    setCopied(false);
    setConfirmed(false);
  }

  // ── Email signup ───────────────────────────────────────────────────────────
  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError("");
    const supabase = createClient();
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { anonymous_alias: alias },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (signupError) { setEmailError(signupError.message); setEmailLoading(false); return; }
    setEmailDone(true);
    setEmailLoading(false);
  }

  // ── Render: email confirmation sent ──────────────────────────────────────
  if (emailDone) {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Check your email</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              We sent a verification link to{" "}
              <strong className="text-slate-700">{email}</strong>.
            </p>
            <div className="bg-slate-50 rounded-2xl p-5 mb-5 border border-slate-100 text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your anonymous alias</p>
              <p className="text-xl font-black text-slate-900">{alias}</p>
              <p className="text-xs text-slate-400 mt-1.5">This is what other members will see — nothing else.</p>
            </div>
            <p className="text-xs text-slate-400">Works with ProtonMail, Tutanota, Gmail, and any email provider.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: choose mode ───────────────────────────────────────────────────
  if (mode === "choose") {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex justify-center mb-8 lg:hidden">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black text-slate-900">Mutual<span className="text-red-600">Aid</span></span>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h1>
              <p className="text-slate-500 text-sm mt-1.5">Choose how you want to protect your anonymity</p>
            </div>

            <div className="space-y-3 mb-6">
              {/* Seed phrase — recommended */}
              <button
                onClick={() => setMode("seed")}
                className="w-full text-left border-2 border-red-500 bg-red-50/30 hover:bg-red-50 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">Seed Phrase</span>
                      <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Fully anonymous — no email required. A 12-word phrase is your only key. Zero traces.
                    </p>
                  </div>
                </div>
              </button>

              {/* Email option */}
              <button
                onClick={() => setMode("email")}
                className="w-full text-left border border-slate-200 hover:border-slate-300 bg-white rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">Email &amp; Password</span>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      Use a burner email for extra privacy. Works with ProtonMail, Tutanota, etc.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-red-600 font-semibold hover:text-red-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: seed phrase flow ──────────────────────────────────────────────
  if (mode === "seed") {
    const words = phrase.split(" ");
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
          <div className="w-full max-w-md">
            <button onClick={() => setMode("choose")}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />Back
            </button>

            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your Seed Phrase</h1>
              <p className="text-slate-500 text-sm mt-1.5">
                This is your account key.{" "}
                <strong className="text-red-600">Write it down now.</strong>{" "}
                There is no email reset — ever.
              </p>
            </div>

            {/* 12-word grid */}
            <div className="bg-slate-950 rounded-2xl p-4 mb-3">
              <div className="grid grid-cols-3 gap-2">
                {words.map((word, i) => (
                  <div key={i} className="bg-slate-800/80 rounded-xl px-3 py-2.5 flex items-center gap-2">
                    <span className="text-slate-500 text-xs w-4 shrink-0 font-mono">{i + 1}</span>
                    <span className="text-white text-sm font-semibold font-mono">{word}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Copy + Regenerate */}
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                {copied
                  ? <><Check className="w-4 h-4 text-emerald-600" />Copied!</>
                  : <><Copy className="w-4 h-4" />Copy phrase</>}
              </button>
              <button type="button" onClick={handleRegenerate}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                <RefreshCw className="w-4 h-4" />New
              </button>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800 flex gap-2.5">
              <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
              <span>Store this phrase somewhere safe — paper, offline notes, or a password manager. Anyone with this phrase can access your account.</span>
            </div>

            <form onSubmit={handleSeedSignup}>
              <label className="flex items-start gap-3 cursor-pointer mb-5 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                <span className="text-sm text-slate-700 leading-relaxed">
                  I have saved my seed phrase and understand it cannot be recovered.
                </span>
              </label>

              {seedError && (
                <div className="flex items-start gap-2.5 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{seedError}
                </div>
              )}

              <button type="submit" className="btn-primary w-full justify-center py-3 text-base font-bold"
                disabled={!confirmed || seedLoading}>
                {seedLoading ? "Creating account..." : "Create Anonymous Account →"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-5">
              Already have a seed phrase?{" "}
              <Link href="/login" className="text-red-600 font-semibold hover:text-red-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: email signup ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <button onClick={() => setMode("choose")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create anonymous account</h1>
            <p className="text-slate-500 text-sm mt-1.5">
              For maximum privacy, use a burner email (ProtonMail, Tutanota).
            </p>
          </div>

          {/* Alias preview */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your community alias will be</p>
              <p className="font-black text-slate-900">{alias}</p>
            </div>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input id="email" type="email" className="input" placeholder="you@proton.me"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              <p className="text-xs text-slate-400 mt-1.5">Never shown publicly. ProtonMail / Tutanota recommended.</p>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" type={showPw ? "text" : "password"} className="input pr-12"
                  placeholder="Minimum 12 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={12} autoComplete="new-password" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {emailError && (
              <div className="flex items-start gap-2.5 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{emailError}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3 text-base font-bold" disabled={emailLoading}>
              {emailLoading ? "Creating account..." : "Create Anonymous Account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-red-600 font-semibold hover:text-red-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
