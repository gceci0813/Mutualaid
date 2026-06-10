"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Shield, Star, MessageSquare, Briefcase,
  ArrowRight, EyeOff, Lock, Users, TrendingUp, ChevronRight,
} from "lucide-react";

// ── Animated counter ──────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCountUp(value, 1600, visible);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black text-white tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-slate-400 mt-1.5 font-medium">{label}</div>
    </div>
  );
}

// ── Anonymous quotes carousel ─────────────────────────────────────
const QUOTES = [
  { text: "I finally said what I've been holding in for six years. Nobody knows it was me, but I know — and that's enough.", role: "Patrol Officer · 8 yrs" },
  { text: "Found out my department was paying rookies 20% more than me. Would never have known without this community.", role: "Firefighter · 11 yrs" },
  { text: "The mental health threads here are the most honest conversations I've ever had about this job.", role: "EMT · 4 yrs" },
  { text: "Used the reviews to pick my new department. Best decision I ever made in my career.", role: "Dispatcher · 6 yrs" },
];

function QuoteCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % QUOTES.length), 4500);
    return () => clearInterval(t);
  }, []);
  const q = QUOTES[active];
  return (
    <div className="relative overflow-hidden">
      <div key={active} className="animate-fade-up">
        <blockquote className="text-xl md:text-2xl font-medium text-white leading-relaxed mb-4">
          &ldquo;{q.text}&rdquo;
        </blockquote>
        <p className="text-red-400 text-sm font-semibold">{q.role}</p>
      </div>
      <div className="flex gap-1.5 mt-6">
        {QUOTES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-red-500" : "w-1.5 bg-slate-600"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Discipline cards ──────────────────────────────────────────────
const DISCIPLINES = [
  { label: "Law Enforcement", emoji: "👮", href: "/agencies?discipline=police", count: "18,000+", color: "from-blue-900/40" },
  { label: "Fire Departments", emoji: "🚒", href: "/agencies?discipline=fire", count: "27,000+", color: "from-red-900/40" },
  { label: "EMS / Ambulance", emoji: "🚑", href: "/agencies?discipline=ems", count: "12,000+", color: "from-orange-900/40" },
  { label: "Dispatch / 911", emoji: "📡", href: "/agencies?discipline=dispatch", count: "6,000+", color: "from-yellow-900/40" },
  { label: "Public Works", emoji: "🔧", href: "/agencies?discipline=dpw", count: "3,000+", color: "from-green-900/40" },
  { label: "Federal (FBI/DHS)", emoji: "🏛️", href: "/agencies?discipline=fbi", count: "500+", color: "from-purple-900/40" },
];

// ── Features ──────────────────────────────────────────────────────
const FEATURES = [
  { icon: EyeOff, title: "Truly Anonymous", desc: "Email verified, never displayed. Your identity stays yours. No real names, no traceable profiles." },
  { icon: Star, title: "Honest Reviews", desc: "Rate your department on culture, leadership, pay, equipment, and more. Like Rate My Professor — but for the job that matters most." },
  { icon: MessageSquare, title: "Community Forum", desc: "Discuss salary, mental health, family life, gear, and anything else with fellow first responders nationwide." },
  { icon: Briefcase, title: "Job Board", desc: "Departments post open positions. Browse by discipline, state, or salary. Apply directly to agencies." },
  { icon: Lock, title: "Security First", desc: "Row-level security, encrypted PII, rate limiting, and zero public profiles. Built for people who can't afford exposure." },
  { icon: Users, title: "First Responder Only", desc: "Verified officers only. A community designed specifically for the people running toward the danger." },
];

export default function LandingPage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative bg-slate-950 overflow-hidden">
        {/* Background orbs */}
        <div className="orb w-[600px] h-[600px] bg-red-700/20 -top-40 -left-32" />
        <div className="orb w-[400px] h-[400px] bg-red-900/15 top-20 right-0" />

        <div className="relative page-container pt-24 pb-32 md:pt-32 md:pb-40">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-semibold mb-8">
              <Shield className="w-3.5 h-3.5" />
              Built for first responders. Secured for first responders.
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-7">
              Speak freely.<br />
              <span className="text-red-500">Your truth</span> matters.
            </h1>

            <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl">
              MutualAid is the anonymous review and community platform built exclusively
              for police, fire, EMS, dispatch, and public safety professionals across the United States.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="btn-primary text-base px-8 py-3.5 rounded-xl shadow-lg shadow-red-900/30">
                Join Anonymously — It&apos;s Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/agencies" className="btn-dark text-base px-8 py-3.5 rounded-xl">
                Browse Agencies
              </Link>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-slate-800">
          <div className="page-container py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedStat value={66000} suffix="+" label="Agencies indexed" />
              <AnimatedStat value={100} suffix="%" label="Anonymous by design" />
              <AnimatedStat value={6} suffix="" label="Disciplines covered" />
              <AnimatedStat value={0} suffix="" label="Public profiles" />
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTES ───────────────────────────────────────── */}
      <section className="bg-slate-900 py-20 border-b border-slate-800">
        <div className="page-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-red-400 text-sm font-bold uppercase tracking-widest mb-4">Real voices</p>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                The conversations that couldn&apos;t happen anywhere else.
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Anonymous. Verified. Unfiltered. First responders finally have a place to say what they actually think.
              </p>
            </div>
            <QuoteCarousel />
          </div>
        </div>
      </section>

      {/* ── DISCIPLINES ──────────────────────────────────── */}
      <section className="py-20 page-container">
        <div className="text-center mb-12">
          <p className="text-red-500 text-sm font-bold uppercase tracking-widest mb-3">Browse by discipline</p>
          <h2 className="section-title mb-3">Find your agency</h2>
          <p className="text-slate-500 max-w-lg mx-auto">See what your peers are really saying — ratings, reviews, and open jobs at every department.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DISCIPLINES.map((d) => (
            <Link
              key={d.label}
              href={d.href}
              className={`card-hover p-6 group bg-gradient-to-br ${d.color} to-transparent hover:shadow-lg`}
            >
              <div className="text-4xl mb-3">{d.emoji}</div>
              <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors mb-1">{d.label}</div>
              <div className="text-sm text-slate-500">{d.count} agencies</div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-400 transition-colors mt-3" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="page-container">
          <div className="text-center mb-12">
            <p className="text-red-500 text-sm font-bold uppercase tracking-widest mb-3">Why MutualAid</p>
            <h2 className="section-title mb-3">Built different. On purpose.</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Glassdoor requires an account. Rate My Professor was built for academia.
              MutualAid was built for the people running toward the danger.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-20 page-container">
        <div className="text-center mb-14">
          <p className="text-red-500 text-sm font-bold uppercase tracking-widest mb-3">How it works</p>
          <h2 className="section-title mb-3">Three steps. Under two minutes.</h2>
          <p className="text-slate-500">No employer will ever know. We built it that way on purpose.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: "01", title: "Sign up anonymously", desc: "Use any email — a burner works great. We verify you're human, then generate a random alias. Your email is encrypted and never shared." },
            { step: "02", title: "Find your department", desc: "Search from 66,000+ indexed US public safety agencies. Police precincts, fire houses, EMS services, dispatch centers, and more." },
            { step: "03", title: "Review & connect", desc: "Rate your department, post in the forum, browse jobs. Every post is linked to your alias — not your identity." },
          ].map((s) => (
            <div key={s.step} className="text-center group">
              <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center text-sm font-black mx-auto mb-5 group-hover:bg-red-600 transition-colors duration-300">
                {s.step}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="bg-slate-950 py-24 relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-red-700/20 -bottom-40 left-1/2 -translate-x-1/2" />
        <div className="relative page-container text-center">
          <TrendingUp className="w-10 h-10 text-red-500 mx-auto mb-5 opacity-80" />
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Ready to speak freely?
          </h2>
          <p className="text-slate-400 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
            Join thousands of first responders sharing the unfiltered truth about life on the job.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn-primary text-base px-10 py-3.5 rounded-xl shadow-lg shadow-red-900/40">
              Create Anonymous Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/agencies" className="btn-dark text-base px-10 py-3.5 rounded-xl">
              Browse Without Account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
