"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Shield, Menu, X, ChevronDown, User, LayoutDashboard, LogOut, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";

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
      { label: "Compare Agencies", href: "/compare" },
    ],
  },
  { label: "Forum", href: "/forum" },
  { label: "Jobs", href: "/jobs" },
  {
    label: "Salary",
    href: "/salary",
    children: [
      { label: "Salary Explorer", href: "/salary" },
      { label: "Compare Agencies", href: "/compare" },
      { label: "Law Enforcement Pay", href: "/agencies?discipline=police" },
      { label: "Fire Dept. Pay", href: "/agencies?discipline=fire" },
      { label: "EMS Pay", href: "/agencies?discipline=ems" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userAlias, setUserAlias] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserAlias(user.user_metadata?.anonymous_alias ?? "Anonymous");
      }
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-700 transition-colors shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              Mutual<span className="text-red-600">Aid</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) =>
              link.children ? (
                <div key={link.label} className="group relative">
                  <button className="btn-ghost text-slate-600 group-hover:text-slate-900">
                    {link.label}
                    <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
                  </button>
                  <div className="absolute top-full left-0 w-52 pt-2 z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl py-1.5 overflow-hidden">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={link.href} href={link.href} className="btn-ghost text-slate-600 hover:text-slate-900">
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Search + notifications */}
          <div className="hidden md:flex items-center gap-0.5">
            <Link href="/search" className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700" aria-label="Search">
              <Search className="w-4 h-4" />
            </Link>
            <NotificationBell />
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
            {userAlias ? (
              <div className="group relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 border border-slate-200 transition-colors text-sm font-medium text-slate-700"
                >
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <span className="max-w-[120px] truncate">{userAlias}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-100 shadow-xl py-1.5 z-50">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <div className="h-px bg-slate-100 mx-3 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-slate-600">Sign In</Link>
                <Link href="/signup" className="btn-primary">Join Anonymously</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="page-container py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <div key={link.label}>
                <Link
                  href={link.href}
                  className="block px-3 py-2.5 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
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
                        className="block px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 border-t border-slate-100">
              {userAlias ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-red-600" />
                    </div>
                    <span className="font-medium">{userAlias}</span>
                  </div>
                  <Link href="/dashboard" className="btn-secondary w-full justify-center" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                  <button onClick={handleSignOut} className="w-full text-sm text-red-600 py-2 hover:bg-red-50 rounded-xl transition-colors">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" className="btn-secondary w-full justify-center" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  <Link href="/signup" className="btn-primary w-full justify-center" onClick={() => setMobileOpen(false)}>Join Anonymously</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
