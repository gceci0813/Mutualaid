import Link from "next/link";
import { Shield, EyeOff, Star, MessageSquare, Briefcase, TrendingUp, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About MutualAid",
  description: "MutualAid is the anonymous review and community platform built exclusively for police, fire, EMS, dispatch, and public safety professionals.",
};

export default function AboutPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">About</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            Built for the people who<br />run toward the danger.
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            MutualAid exists because first responders deserve a place to tell the truth about the job —
            without risking the job.
          </p>
        </div>
      </div>

      <div className="page-container py-12 max-w-3xl">
        <div className="prose-section space-y-6 text-slate-600 text-base leading-relaxed mb-12">
          <p>
            Every other profession has this. Tech workers have Glassdoor and Blind. Teachers rate their
            schools. Nurses compare hospitals. But the people running into burning buildings, answering
            3 a.m. calls, and working double shifts in a patrol car? They&apos;ve had nothing — because
            speaking honestly about a department could end a career.
          </p>
          <p>
            MutualAid changes that. Verified first responders review their agencies on culture,
            leadership, pay, equipment, work-life balance, and more — completely anonymously. A randomly
            generated alias is the only identity anyone ever sees. Even verification is
            privacy-preserving: verify with a .gov email and we keep only the domain, deleting the
            address itself forever.
          </p>
          <p>
            The result is the largest honest dataset on what it&apos;s actually like to work in public
            safety — helping officers pick their next department, helping agencies understand and fix
            their culture, and helping the next generation make informed career decisions.
          </p>
        </div>

        {/* What we offer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {[
            { icon: Star, title: "Anonymous Reviews", desc: "59,000+ agencies indexed and rated by verified officers", href: "/agencies" },
            { icon: MessageSquare, title: "Community Forum", desc: "Salary, mental health, family life — the real conversations", href: "/forum" },
            { icon: Briefcase, title: "Job Board", desc: "Open positions with real salary data, posted by departments", href: "/jobs" },
            { icon: TrendingUp, title: "Salary Intelligence", desc: "Pay data and satisfaction scores by discipline and state", href: "/salary" },
          ].map(({ icon: Icon, title, desc, href }) => (
            <Link key={title} href={href} className="card p-5 hover:border-red-200 hover:shadow-sm transition-all group">
              <Icon className="w-5 h-5 text-red-600 mb-3" />
              <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors mb-1">{title}</p>
              <p className="text-sm text-slate-500">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Privacy promise */}
        <div className="card p-7 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-red-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <EyeOff className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-black text-white text-lg mb-2">The anonymity promise</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                No real names. No public profiles. No way for a department to trace a review back to an
                officer — not even by asking us, because we designed the system so we don&apos;t know
                either. Read the details in our{" "}
                <Link href="/privacy" className="text-red-400 hover:text-red-300 font-semibold">Privacy Policy</Link>.
              </p>
              <Link href="/signup" className="btn-primary text-sm">
                Join Anonymously <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
