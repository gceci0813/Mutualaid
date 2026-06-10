import Link from "next/link";
import { Shield } from "lucide-react";

const EXPLORE_LINKS = [
  { href: "/agencies", label: "Browse Agencies" },
  { href: "/forum", label: "Community Forum" },
  { href: "/jobs", label: "Job Board" },
  { href: "/pricing", label: "Pricing" },
];

const DISCIPLINE_LINKS = [
  { href: "/agencies?discipline=police", label: "Law Enforcement" },
  { href: "/agencies?discipline=fire",   label: "Fire Departments" },
  { href: "/agencies?discipline=ems",    label: "EMS / Ambulance" },
  { href: "/agencies?discipline=dispatch", label: "Dispatch / 911" },
  { href: "/agencies?discipline=dpw",    label: "Public Works" },
];

const LEGAL_LINKS = [
  { href: "/privacy",              label: "Privacy Policy" },
  { href: "/terms",                label: "Terms of Service" },
  { href: "/community-guidelines", label: "Community Guidelines" },
  { href: "/about",                label: "About MutualAid" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/60 mt-20">
      <div className="page-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/30">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-white font-black text-lg tracking-tight">
                Mutual<span className="text-red-500">Aid</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-500 mb-5">
              The anonymous community built by first responders, for first responders.
            </p>
            <div className="inline-flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-800/30 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-400 font-semibold">Anonymity guaranteed</span>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              {EXPLORE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors hover:translate-x-0.5 inline-block">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disciplines */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Disciplines</h4>
            <ul className="space-y-2.5 text-sm">
              {DISCIPLINE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors hover:translate-x-0.5 inline-block">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Legal &amp; Safety</h4>
            <ul className="space-y-2.5 text-sm">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors hover:translate-x-0.5 inline-block">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p>&copy; {new Date().getFullYear()} MutualAid. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            Built for privacy. Built for the brave.
          </p>
        </div>
      </div>
    </footer>
  );
}
