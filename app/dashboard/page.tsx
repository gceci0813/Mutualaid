import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Shield, Search, MessageSquare, Briefcase, ChevronRight, CheckCircle } from "lucide-react";

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
    supabase
      .from("user_profiles")
      .select("is_verified_officer, verified_agency_id, agencies(name)")
      .eq("id", user.id)
      .single(),
  ]);

  const isVerified = profile?.is_verified_officer ?? false;
  const verifiedAgencyName = (profile?.agencies as unknown as { name: string } | null)?.name ?? null;

  const quickLinks = [
    {
      href: "/agencies",
      icon: Search,
      label: "Browse Agencies",
      description: "Find and review departments across the US",
    },
    {
      href: "/forum",
      icon: MessageSquare,
      label: "Community Forum",
      description: "Discuss topics with fellow first responders",
    },
    {
      href: "/jobs",
      icon: Briefcase,
      label: "Job Board",
      description: "Find open positions or post for your department",
    },
  ];

  return (
    <div className="page-container py-10 max-w-3xl">
      {/* Header */}
      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Signed in as</p>
          <h1 className="text-xl font-bold text-slate-900">{alias}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Your identity is protected — only your alias is visible</p>
        </div>
      </div>

      {/* Verification status */}
      {isVerified ? (
        <div className="card p-4 mb-6 flex items-center gap-3 border-blue-100 bg-blue-50">
          <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">Verified Officer</p>
            {verifiedAgencyName && (
              <p className="text-xs text-blue-600 mt-0.5">{verifiedAgencyName}</p>
            )}
          </div>
          <span className="badge bg-blue-100 text-blue-700 text-xs">✓ Active</span>
        </div>
      ) : (
        <Link
          href="/dashboard/verify"
          className="card p-4 mb-6 flex items-center gap-3 hover:border-red-200 hover:shadow-sm transition-all group"
        >
          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-red-50 transition-colors">
            <Shield className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-colors" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Get your Verified Officer badge</p>
            <p className="text-xs text-slate-400">Enter the access code from your department</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-400 transition-colors" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{reviewCount ?? 0}</p>
          <p className="text-sm text-slate-500 mt-1">Review{reviewCount !== 1 ? "s" : ""} posted</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-slate-900">{threadCount ?? 0}</p>
          <p className="text-sm text-slate-500 mt-1">Thread{threadCount !== 1 ? "s" : ""} started</p>
        </div>
      </div>

      {/* Quick links */}
      <h2 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Quick Access</h2>
      <div className="space-y-3">
        {quickLinks.map(({ href, icon: Icon, label, description }) => (
          <Link
            key={href}
            href={href}
            className="card p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-red-50 transition-colors">
              <Icon className="w-5 h-5 text-slate-500 group-hover:text-red-600 transition-colors" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-sm">{label}</p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
