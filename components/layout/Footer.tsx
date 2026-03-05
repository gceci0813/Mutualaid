import Link from "next/link";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-20">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">
                Mutual<span className="text-red-500">Aid</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              The anonymous community built by first responders, for first
              responders.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/agencies" className="hover:text-white transition-colors">Browse Agencies</Link></li>
              <li><Link href="/forum" className="hover:text-white transition-colors">Community Forum</Link></li>
              <li><Link href="/jobs" className="hover:text-white transition-colors">Job Board</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Disciplines</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/agencies?discipline=police" className="hover:text-white transition-colors">Law Enforcement</Link></li>
              <li><Link href="/agencies?discipline=fire" className="hover:text-white transition-colors">Fire Departments</Link></li>
              <li><Link href="/agencies?discipline=ems" className="hover:text-white transition-colors">EMS / Ambulance</Link></li>
              <li><Link href="/agencies?discipline=dispatch" className="hover:text-white transition-colors">Dispatch / 911</Link></li>
              <li><Link href="/agencies?discipline=dpw" className="hover:text-white transition-colors">Public Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Legal & Safety</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/community-guidelines" className="hover:text-white transition-colors">Community Guidelines</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About MutualAid</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>&copy; {new Date().getFullYear()} MutualAid. All rights reserved.</p>
          <p>
            Built with privacy and security for the first responder community.
          </p>
        </div>
      </div>
    </footer>
  );
}
