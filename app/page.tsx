import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Shield, Star, MessageSquare, Briefcase,
  ArrowRight, EyeOff, Lock, Users, TrendingUp, ChevronRight,
  MapPin, Trophy,
} from "lucide-react";
import { DISCIPLINE_LABELS } from "@/lib/utils";
import { AnimatedStat, QuoteCarousel } from "./HomeClient";
import type { DisciplineType } from "@/types";

export const revalidate = 300; // refresh live stats every 5 minutes

// ── Discipline cards (counts fetched live) ────────────────────────
const DISCIPLINES = [
  { label: "Law Enforcement", emoji: "👮", href: "/agencies?discipline=police", filter: ["police"], color: "from-blue-900/40" },
  { label: "Fire Departments", emoji: "🚒", href: "/agencies?discipline=fire", filter: ["fire"], color: "from-red-900/40" },
  { label: "EMS / Ambulance", emoji: "🚑", href: "/agencies?discipline=ems", filter: ["ems"], color: "from-orange-900/40" },
  { label: "Dispatch / 911", emoji: "📡", href: "/agencies?discipline=dispatch", filter: ["dispatch"], color: "from-yellow-900/40" },
  { label: "Corrections", emoji: "🔒", href: "/agencies?discipline=corrections", filter: ["corrections"], color: "from-green-900/40" },
  { label: "Federal (FBI/DHS)", emoji: "🏛️", href: "/agencies?discipline=fbi", filter: ["fbi", "dhs"], color: "from-purple-900/40" },
];

// "19,586" → "19,500+ agencies"; small counts shown exactly; zero → growing
function countLabel(n: number): string {
  if (n >= 1000) return `${(Math.floor(n / 500) * 500).toLocaleString()}+ agencies`;
  if (n > 0) return `${n} agencies`;
  return "Growing directory";
}

// ── Features ──────────────────────────────────────────────────────
const FEATURES = [
  { icon: EyeOff, title: "Truly Anonymous", desc: "Email verified, never displayed. Your identity stays yours. No real names, no traceable profiles." },
  { icon: Star, title: "Honest Reviews", desc: "Rate your department on culture, leadership, pay, equipment, and more. Like Rate My Professor — but for the job that matters most." },
  { icon: MessageSquare, title: "Community Forum", desc: "Discuss salary, mental health, family life, gear, and anything else with fellow first responders nationwide." },
  { icon: Briefcase, title: "Job Board", desc: "Departments post open positions. Browse by discipline, state, or salary. Apply directly to agencies." },
  { icon: Lock, title: "Security First", desc: "Row-level security, encrypted PII, rate limiting, and zero public profiles. Built for people who can't afford exposure." },
  { icon: Users, title: "First Responder Only", desc: "Verified officers only. A community designed specifically for the people running toward the danger." },
];

function timeAgo(dateStr: string): string {
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default async function LandingPage() {
  const supabase = await createClient();

  // Live platform stats + activity, all in parallel
  const [
    { count: agencyCount },
    { count: reviewCount },
    { count: threadCount },
    { data: topAgencies },
    { data: recentThreads },
    { data: recentJobs },
    ...disciplineCounts
  ] = await Promise.all([
    supabase.from("agencies").select("*", { count: "estimated", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("threads").select("*", { count: "exact", head: true }),
    supabase.from("agencies")
      .select("id, name, slug, city, state_abbr, discipline, avg_overall, review_count")
      .not("avg_overall", "is", null)
      .gte("review_count", 1)
      .order("avg_overall", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(3),
    supabase.from("threads")
      .select("id, title, upvotes, comment_count, created_at")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("jobs")
      .select("id, title, discipline, created_at, agencies(name, city, state_abbr)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3),
    ...DISCIPLINES.map((d) =>
      supabase.from("agencies").select("*", { count: "exact", head: true }).in("discipline", d.filter)
    ),
  ]);

  const hasActivity =
    (topAgencies?.length ?? 0) > 0 || (recentThreads?.length ?? 0) > 0 || (recentJobs?.length ?? 0) > 0;

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

        {/* Stats strip — live numbers */}
        <div className="relative border-t border-slate-800">
          <div className="page-container py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedStat value={agencyCount ?? 79000} suffix="+" label="Agencies indexed" />
              <AnimatedStat value={reviewCount ?? 0} suffix="" label="Anonymous reviews" />
              <AnimatedStat value={threadCount ?? 0} suffix="" label="Forum discussions" />
              <AnimatedStat value={100} suffix="%" label="Anonymous by design" />
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE ACTIVITY ────────────────────────────────── */}
      {hasActivity && (
        <section className="py-20 page-container">
          <div className="text-center mb-12">
            <p className="text-red-500 text-sm font-bold uppercase tracking-widest mb-3">Happening now</p>
            <h2 className="section-title mb-3">Live on MutualAid</h2>
            <p className="text-slate-500 max-w-lg mx-auto">Real reviews, real conversations, real openings — updated continuously.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top rated agencies */}
            {(topAgencies?.length ?? 0) > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />Top Rated Agencies
                  </h3>
                  <Link href="/rankings" className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors">
                    Rankings →
                  </Link>
                </div>
                <div className="space-y-3">
                  {topAgencies!.map((agency, i) => (
                    <Link
                      key={agency.id}
                      href={`/agencies/${agency.slug}`}
                      className="flex items-center gap-3 group"
                    >
                      <span className="text-lg w-7 text-center shrink-0">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-red-600 transition-colors truncate">
                          {agency.name}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{agency.city}, {agency.state_abbr}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-black text-slate-900">{agency.avg_overall?.toFixed(1)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent discussions */}
            {(recentThreads?.length ?? 0) > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />Active Discussions
                  </h3>
                  <Link href="/forum" className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors">
                    Forum →
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentThreads!.map((thread) => (
                    <Link key={thread.id} href={`/forum/${thread.id}`} className="block group">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-red-600 transition-colors line-clamp-1">
                        {thread.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {thread.upvotes} upvotes · {thread.comment_count} comments · {timeAgo(thread.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Latest jobs */}
            {(recentJobs?.length ?? 0) > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-500" />Latest Openings
                  </h3>
                  <Link href="/jobs" className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors">
                    All Jobs →
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentJobs!.map((job) => {
                    const agency = job.agencies as unknown as { name: string; city: string; state_abbr: string } | null;
                    return (
                      <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-red-600 transition-colors line-clamp-1">
                          {job.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {agency ? `${agency.name} · ${agency.city}, ${agency.state_abbr} · ` : ""}
                          {DISCIPLINE_LABELS[job.discipline as DisciplineType]}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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
          {DISCIPLINES.map((d, i) => (
            <Link
              key={d.label}
              href={d.href}
              className={`card-hover p-6 group bg-gradient-to-br ${d.color} to-transparent hover:shadow-lg`}
            >
              <div className="text-4xl mb-3">{d.emoji}</div>
              <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors mb-1">{d.label}</div>
              <div className="text-sm text-slate-500">{countLabel(disciplineCounts[i]?.count ?? 0)}</div>
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
            { step: "02", title: "Find your department", desc: "Search from 79,000+ indexed US public safety agencies. Police precincts, fire houses, EMS services, dispatch centers, and more." },
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
