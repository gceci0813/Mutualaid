"use client";

import Link from "next/link";
import { useState } from "react";
import { Shield, Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  {
    label: "Agencies",
    href: "/agencies",
    children: [
      { label: "Browse All", href: "/agencies" },
      { label: "Law Enforcement", href: "/agencies?discipline=police" },
      { label: "Fire Departments", href: "/agencies?discipline=fire" },
      { label: "EMS / Ambulance", href: "/agencies?discipline=ems" },
      { label: "Dispatch / 911", href: "/agencies?discipline=dispatch" },
    ],
  },
  { label: "Forum", href: "/forum" },
  { label: "Jobs", href: "/jobs" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700 transition-colors">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              Mutual<span className="text-red-600">Aid</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) =>
              link.children ? (
                // Pure CSS hover — no JS delay, no gap issues
                <div key={link.label} className="group relative">
                  <button className="btn-ghost group-hover:bg-slate-100">
                    {link.label}
                    <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                  </button>
                  {/* pt-1 keeps visual gap as padding so hover zone is unbroken */}
                  <div className="absolute top-full left-0 w-52 pt-1 z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-100">
                    <div className="card py-1 shadow-lg">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={link.href} href={link.href} className="btn-ghost">
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="btn-ghost">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary">
              Join Anonymously
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="page-container py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <div key={link.label}>
                <Link
                  href={link.href}
                  className="block px-3 py-2.5 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
                {link.children && (
                  <div className="ml-4 space-y-0.5">
                    {link.children.slice(1).map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/login" className="btn-secondary w-full justify-center">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary w-full justify-center">
                Join Anonymously
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
