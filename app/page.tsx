import Link from "next/link";
import {
  Shield,
  Search,
  Star,
  MessageSquare,
  Briefcase,
  Lock,
  Users,
  TrendingUp,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import HeroSearch from "@/components/HeroSearch";

const DISCIPLINES = [
  { label: "Law Enforcement", emoji: "👮", href: "/agencies?discipline=police", count: "18,000+" },
  { label: "Fire Departments", emoji: "🚒", href: "/agencies?discipline=fire", count: "27,000+" },
  { label: "EMS / Ambulance", emoji: "🚑", href: "/agencies?discipline=ems", count: "12,000+" },
  { label: "Dispatch / 911", emoji: "📡", href: "/agencies?discipline=dispatch", count: "6,000+" },
  { label: "Public Works", emoji: "🔧", href: "/agencies?discipline=dpw", count: "3,000+" },
  { label: "Federal (FBI/DHS)", emoji: "🏛️", href: "/agencies?discipline=fbi", count: "500+" },
];

const FEATURES = [
  {
    icon: EyeOff,
    title: "Truly Anonymous",
    desc: "Email verified, never displayed. Your identity stays yours — always. No real names, no traceable profiles.",
  },
  {
    icon: Star,
    title: "Honest Reviews",
    desc: "Rate your department on culture, leadership, pay, equipment, and more. Like Rate My Professor — but for the job that matters most.",
  },
  {
    icon: MessageSquare,
    title: "Community Forum",
    desc: "Discuss salary, mental health, family life, gear, and anything else with fellow first responders nationwide.",
  },
  {
    icon: Briefcase,
    title: "Job Board",
    desc: "Departments post open positions. Browse by discipline, state, or salary. Apply directly to agencies.",
  },
  {
    icon: Lock,
    title: "Security First",
    desc: "End-to-end encryption, zero PII in public data, rate limiting, and row-level security. Built for people who can't afford exposure.",
  },
  {
    icon: Users,
    title: "First Responder Only",
    desc: "A community designed specifically for police, fire, EMS, dispatch, DPW, and federal public safety professionals.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 50%, #dc2626 0%, transparent 50%),
                              radial-gradient(circle at 75% 20%, #1e3a5f 0%, transparent 60%)`,
          }}
        />
        <div className="relative page-container py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-full text-red-400 text-sm font-medium mb-6">
              <Shield className="w-3.5 h-3.5" />
              Built for first responders. Secured for first responders.
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Your career. Your truth.{" "}
              <span className="text-red-500">Anonymously.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl">
              MutualAid is the first anonymous review and community platform
              built exclusively for police, fire, EMS, dispatch, and public
              safety professionals across the United States.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link href="/signup" className="btn-primary text-base px-8 py-3">
                Join Anonymously — It&apos;s Free
              </Link>
              <Link href="/agencies" className="btn-secondary text-base px-8 py-3 bg-white/10 border-white/20 text-white hover:bg-white/20">
                Browse Agencies
              </Link>
            </div>

            {/* Search bar */}
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-slate-200">
        <div className="page-container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "66,000+", label: "Agencies indexed" },
              { value: "100%", label: "Anonymous by design" },
              { value: "5", label: "Disciplines covered" },
              { value: "0", label: "Public profiles" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disciplines */}
      <section className="py-16 page-container">
        <div className="text-center mb-10">
          <h2 className="section-title mb-2">Browse by Discipline</h2>
          <p className="text-slate-500">Find your agency and see what your peers are saying.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DISCIPLINES.map((d) => (
            <Link
              key={d.label}
              href={d.href}
              className="card p-5 hover:border-red-200 hover:shadow-md transition-all group"
            >
              <div className="text-3xl mb-3">{d.emoji}</div>
              <div className="font-semibold text-slate-900 group-hover:text-red-600 transition-colors">
                {d.label}
              </div>
              <div className="text-sm text-slate-500 mt-1">{d.count} agencies</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">Why MutualAid?</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Glassdoor requires an account. Rate My Professor was built for academia.
              MutualAid was built for the people running toward the danger.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 page-container">
        <div className="text-center mb-12">
          <h2 className="section-title mb-2">How It Works</h2>
          <p className="text-slate-500">Three steps. Fully anonymous. No employer will ever know.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              step: "1",
              icon: Eye,
              title: "Sign up anonymously",
              desc: "Use any email — a burner works great. We verify you're human, then generate a random alias. Your email is encrypted and never shared.",
            },
            {
              step: "2",
              icon: Search,
              title: "Find your department",
              desc: "Search from 66,000+ indexed US public safety agencies. Police precincts, fire houses, EMS services, dispatch centers, and more.",
            },
            {
              step: "3",
              icon: Star,
              title: "Review & connect",
              desc: "Rate your department, post in the forum, browse jobs. Every post is linked to your alias — not your identity.",
            },
          ].map((step) => (
            <div key={step.step} className="text-center">
              <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {step.step}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-red-600 text-white py-16">
        <div className="page-container text-center">
          <TrendingUp className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Ready to speak freely?
          </h2>
          <p className="text-red-100 mb-8 max-w-lg mx-auto text-lg">
            Join thousands of first responders sharing the unfiltered truth
            about life on the job.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors text-base"
            >
              Create Anonymous Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/agencies"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-800 transition-colors text-base"
            >
              Browse Without Account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
