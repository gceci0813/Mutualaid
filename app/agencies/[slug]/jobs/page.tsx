import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Briefcase, MapPin, DollarSign, Clock, Star } from "lucide-react";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS, formatSalary } from "@/lib/utils";
import type { Agency, Job } from "@/types";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: agency } = await supabase.from("agencies").select("name, city, state_abbr").eq("slug", slug).single();
  if (!agency) return {};
  return {
    title: `${agency.name} Jobs & Open Positions`,
    description: `Open positions at ${agency.name} in ${agency.city}, ${agency.state_abbr}. Salaries, requirements, and application links.`,
  };
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default async function AgencyJobsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: agencyData } = await supabase.from("agencies").select("*").eq("slug", slug).single();
  if (!agencyData) notFound();
  const agency = agencyData as Agency;

  const { data: jobData } = await supabase
    .from("jobs")
    .select("*")
    .eq("agency_id", agency.id)
    .eq("active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  const jobs = (jobData ?? []) as (Job & { is_featured?: boolean })[];

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <nav className="flex items-center gap-1.5 text-sm mb-5">
            <Link href="/agencies" className="text-slate-400 hover:text-slate-600 transition-colors">Agencies</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link href={`/agencies/${slug}`} className="text-slate-400 hover:text-slate-600 transition-colors">{agency.name}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-700 font-medium">Jobs</span>
          </nav>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <span className={cn("badge mb-3", DISCIPLINE_COLORS[agency.discipline])}>
                {DISCIPLINE_LABELS[agency.discipline]}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">{agency.name}</h1>
              <p className="flex items-center gap-1.5 text-slate-500 text-sm">
                <MapPin className="w-4 h-4" />{agency.city}, {agency.state}
                {jobs.length > 0 && (
                  <span className="text-slate-400">· {jobs.length} open position{jobs.length !== 1 ? "s" : ""}</span>
                )}
              </p>
            </div>
            <Link href="/jobs/post" className="btn-primary shrink-0 self-start">
              Post a Job
            </Link>
          </div>
        </div>
      </div>

      <div className="page-container py-10 max-w-4xl">
        {/* Tab nav */}
        <div className="flex gap-1 border-b border-slate-200 mb-6">
          {[
            { label: "Reviews", href: `/agencies/${slug}` },
            { label: "Forum", href: `/agencies/${slug}/forum` },
            { label: "Jobs", href: `/agencies/${slug}/jobs`, active: true },
          ].map((tab) => (
            <Link key={tab.label} href={tab.href}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
                tab.active ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}>
              {tab.label}
            </Link>
          ))}
        </div>

        {jobs.length === 0 ? (
          <div className="card p-12 text-center">
            <Briefcase className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-700 mb-1">No open positions at {agency.name}</p>
            <p className="text-sm text-slate-400 mb-4">
              Check the nationwide job board, or post a position if you represent this agency.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/jobs" className="btn-primary">Browse All Jobs</Link>
              <Link href="/jobs/post" className="btn-secondary">Post a Job</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const salaryText = formatSalary(job.salary_min, job.salary_max, job.salary_type);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className={cn(
                    "card p-5 block hover:border-red-200 hover:shadow-sm transition-all group",
                    job.is_featured && "border-amber-200 ring-1 ring-amber-100"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {job.is_featured && (
                          <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1 text-xs">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />Featured
                          </span>
                        )}
                        <span className="badge bg-slate-100 text-slate-600 capitalize text-xs">
                          {job.employment_type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors mb-1">
                        {job.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        {salaryText !== "Salary not listed" && (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <DollarSign className="w-3 h-3" />{salaryText}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{timeAgo(job.created_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-red-300 transition-colors shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/jobs" className="text-sm text-slate-500 hover:text-red-600 font-medium transition-colors">
            Browse the nationwide job board →
          </Link>
        </div>
      </div>
    </>
  );
}
