import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, MapPin, DollarSign, Clock, Briefcase,
  Building2, ExternalLink, CalendarDays, Users, Star
} from "lucide-react";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS, formatSalary } from "@/lib/utils";
import type { Job } from "@/types";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("jobs").select("*, agencies(*)").eq("id", id).single();
  if (!data) notFound();

  const job = data as Job & {
    agencies: { name: string; city: string; state: string; state_abbr: string; website?: string; slug: string };
    is_featured?: boolean;
  };
  const agency = job.agencies;
  const salaryText = formatSalary(job.salary_min, job.salary_max, job.salary_type);

  function timeAgo(dateStr: string): string {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  }

  return (
    <>
      {/* Dark page header */}
      <div className="page-header">
        <div className="page-header-inner">
          <Link href="/jobs"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm font-medium mb-5 transition-colors">
            <ChevronLeft className="w-4 h-4" />Back to jobs
          </Link>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {job.is_featured && (
                  <span className="badge bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />Featured
                  </span>
                )}
                <span className={cn("badge", DISCIPLINE_COLORS[job.discipline])}>
                  {DISCIPLINE_LABELS[job.discipline]}
                </span>
                <span className="badge bg-slate-100 text-slate-600 capitalize">
                  {job.employment_type.replace("_", " ")}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">{job.title}</h1>

              <div className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
                <Building2 className="w-4 h-4 text-slate-400" />
                <Link href={`/agencies/${agency.slug}`} className="hover:text-red-600 transition-colors">
                  {agency.name}
                </Link>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />{agency.city}, {agency.state_abbr}
                </span>
                {salaryText !== "Salary not listed" && (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <DollarSign className="w-3.5 h-3.5" />{salaryText}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />{timeAgo(job.created_at)}
                </span>
                {job.deadline && (
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <CalendarDays className="w-3.5 h-3.5" />Apply by{" "}
                    {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>

            {/* Apply CTA in header */}
            {job.external_apply_url && (
              <a href={job.external_apply_url} target="_blank" rel="noopener noreferrer"
                className="btn-primary self-start shrink-0">
                Apply Now <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="page-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            <div className="card p-6">
              <h2 className="font-bold text-slate-900 mb-4 text-base">Position Description</h2>
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                {job.description}
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div className="card p-6">
                <h2 className="font-bold text-slate-900 mb-4 text-base">Requirements &amp; Qualifications</h2>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {job.requirements}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="card p-6">
                <h2 className="font-bold text-slate-900 mb-4 text-base">Benefits</h2>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {job.benefits}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply CTA */}
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Apply for this Position</p>
              {job.external_apply_url ? (
                <>
                  <a href={job.external_apply_url} target="_blank" rel="noopener noreferrer"
                    className="btn-primary w-full justify-center">
                    Apply on Department Website <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-xs text-slate-400 text-center mt-2">
                    You&apos;ll be redirected to the department&apos;s official application portal.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Contact the department directly to apply for this position.
                </p>
              )}
            </div>

            {/* Job details */}
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Job Details</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />Type</span>
                  <span className="font-semibold text-slate-800 capitalize">{job.employment_type.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Discipline</span>
                  <span className="font-semibold text-slate-800">{DISCIPLINE_LABELS[job.discipline]}</span>
                </div>
                {salaryText !== "Salary not listed" && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />Salary</span>
                    <span className="font-semibold text-emerald-700">{salaryText}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Posted</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                {job.deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Deadline</span>
                    <span className="font-semibold text-red-600">
                      {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Agency info */}
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">About the Agency</p>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />{agency.name}
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />{agency.city}, {agency.state}
                </div>
              </div>
              <div className="space-y-2">
                <Link href={`/agencies/${agency.slug}`} className="btn-secondary w-full justify-center text-xs">
                  <Users className="w-3.5 h-3.5" />View Reviews &amp; Ratings
                </Link>
                {agency.website && (
                  <a href={agency.website} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary w-full justify-center text-xs">
                    Official Website <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
