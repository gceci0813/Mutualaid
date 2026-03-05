import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, MapPin, DollarSign, Clock, Briefcase,
  Building2, ExternalLink, CalendarDays, Users
} from "lucide-react";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS, formatSalary } from "@/lib/utils";
import type { Job } from "@/types";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("jobs")
    .select("*, agencies(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const job = data as Job & { agencies: { name: string; city: string; state: string; state_abbr: string; website?: string; slug: string } };
  const agency = job.agencies;
  const salaryText = formatSalary(job.salary_min, job.salary_max, job.salary_type);

  return (
    <div className="page-container py-10">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={cn("badge", DISCIPLINE_COLORS[job.discipline])}>
                {DISCIPLINE_LABELS[job.discipline]}
              </span>
              <span className="badge bg-slate-100 text-slate-600 capitalize">
                {job.employment_type.replace("_", " ")}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">{job.title}</h1>

            <div className="flex items-center gap-2 text-slate-700 font-medium mb-4">
              <Building2 className="w-4 h-4" />
              <Link
                href={`/agencies/${agency.slug}`}
                className="hover:text-red-600 transition-colors"
              >
                {agency.name}
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4 border-y border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                {agency.city}, {agency.state_abbr}
              </div>
              {salaryText !== "Salary not listed" && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  {salaryText}
                </div>
              )}
              {job.deadline && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  Deadline:{" "}
                  {new Date(job.deadline).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Position Description</h2>
            <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 mb-3">Requirements & Qualifications</h2>
              <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                {job.requirements}
              </div>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 mb-3">Benefits</h2>
              <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                {job.benefits}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply CTA */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Apply for this Position</h3>
            {job.external_apply_url ? (
              <>
                <a
                  href={job.external_apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center"
                >
                  Apply on Department Website
                  <ExternalLink className="w-4 h-4" />
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

          {/* Agency info */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">About the Agency</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-slate-600">
                <Building2 className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                {agency.name}
              </div>
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                {agency.city}, {agency.state}
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Link
                href={`/agencies/${agency.slug}`}
                className="btn-secondary w-full justify-center text-xs"
              >
                <Users className="w-3.5 h-3.5" />
                View Reviews
              </Link>
              {agency.website && (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost w-full justify-center text-xs"
                >
                  Official Website
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Job details */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Job Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-medium capitalize">{job.employment_type.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discipline</span>
                <span className="font-medium">{DISCIPLINE_LABELS[job.discipline]}</span>
              </div>
              {salaryText !== "Salary not listed" && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Salary</span>
                  <span className="font-medium">{salaryText}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Posted</span>
                <span className="font-medium">
                  {new Date(job.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
