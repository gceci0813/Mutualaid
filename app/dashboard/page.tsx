import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Shield, Search, MessageSquare, Briefcase, ChevronRight,
  CheckCircle, Star, Building2, Mail, Lock, ArrowRight, User
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const alias = user.user_metadata?.anonymous_alias ?? "Anonymous";

  const [
    { count: reviewCount },
    { count: threadCount },
    { data: profile },
  ] = await Promise.all([
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("threads").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("user_profiles")
      .select("is_verified_officer, verified_agency_id, verified_domain, subscription_tier, agencies(name)")
      .eq("id", user.id).single(),
  ]);

  const isVerified = profile?.is_verified_officer ?? false;
  const verifiedAgencyName = (profile?.agencies as unknown as { name: string } | null)?.name ?? null;
  const verifiedDomain = (profile as unknown as { verified_domain?: string } | null)?.verified_domain ?? null;
  const isPremium = (profile as unknown as { subscription_tier?: string } | null)?.subscription_tier === "premium";

  return (
    <>
      {/* Light page header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Signed in as</p>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{alias}</h1>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-1">Your identity is fully protected — only your alias is visible to others.</p>
        </div>
      </div>

      <div className="page-container py-10 max-w-3xl">
        {/* Verification status */}
        {isVerified ? (
          <div className="card p-4 mb-5 flex items-center gap-3 border-emerald-100 bg-emerald-50">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800">Verified Officer</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {verifiedAgencyName ?? (verifiedDomain ? `Verified via ${verifiedDomain}` : "Your badge appears on all reviews")}
              </p>
            </div>
            <span className="badge bg-emerald-100 text-emerald-700 text-xs">✓ Active</span>
          </div>
        ) : (
          <div className="card p-5 mb-5 border-dashed border-2 border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 mb-1">Get your Verified Officer badge</p>
                <p className="text-xs text-slate-500 mb-3">Required to post reviews, threads, and comments. Your identity stays anonymous.</p>
                <div className="flex gap-2 flex-wrap">
                  <Link href="/dashboard/verify-email" className="btn-primary text-xs py-1.5 px-3 gap-1.5">
                    <Mail className="w-3.5 h-3.5" />Verify with .gov Email
                  </Link>
                  <Link href="/dashboard/verify" className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
                    <Lock className="w-3.5 h-3.5" />Use Access Code
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { value: reviewCount ?? 0, label: "Reviews posted", icon: Star },
            { value: threadCount ?? 0, label: "Threads started", icon: MessageSquare },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="card p-5 text-center">
              <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-3xl font-black text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Access</p>
        <div className="space-y-2 mb-4">
          {[
            { href: "/agencies", icon: Search, label: "Browse Agencies", desc: "Find and review departments across the US" },
            { href: "/forum", icon: MessageSquare, label: "Community Forum", desc: "Discuss topics with fellow first responders" },
            { href: "/jobs", icon: Briefcase, label: "Job Board", desc: "Find open positions or post for your department" },
            { href: "/dashboard/agency", icon: Building2, label: "Agency Dashboard", desc: "Manage your claimed agency profiles" },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href} className="card p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-50 transition-colors">
                <Icon className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-sm">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-400 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Premium CTA */}
        {!isPremium && (
          <div className="card p-5 bg-slate-900 border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm mb-1">Unlock Premium</p>
                <p className="text-xs text-slate-400 mb-3">Salary analytics, advanced filtering, ad-free experience — $4.99/month.</p>
                <Link href="/pricing" className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors">
                  See what&apos;s included <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
