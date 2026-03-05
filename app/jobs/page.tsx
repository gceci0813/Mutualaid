"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase, MapPin, DollarSign, Clock, Search, Filter,
  ExternalLink, Building2, Plus, ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS, US_STATES, formatSalary } from "@/lib/utils";
import type { Job, DisciplineType } from "@/types";

const EMPLOYMENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "volunteer", label: "Volunteer" },
  { value: "per_diem", label: "Per Diem" },
];

const DISCIPLINES = [
  { value: "", label: "All Disciplines" },
  { value: "police", label: "Law Enforcement" },
  { value: "fire", label: "Fire Department" },
  { value: "ems", label: "EMS / Ambulance" },
  { value: "dispatch", label: "Dispatch / 911" },
  { value: "dpw", label: "Public Works" },
  { value: "corrections", label: "Corrections" },
];

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
}

function JobCard({ job }: { job: Job & { agencies?: { name: string; city: string; state_abbr: string } } }) {
  const agency = job.agencies;
  const salaryText = formatSalary(job.salary_min, job.salary_max, job.salary_type);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="card p-5 block hover:border-red-200 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={cn("badge", DISCIPLINE_COLORS[job.discipline])}>
              {DISCIPLINE_LABELS[job.discipline]}
            </span>
            <span className="badge bg-slate-100 text-slate-600 capitalize">
              {job.employment_type.replace("_", " ")}
            </span>
          </div>

          <h3 className="font-semibold text-slate-900 group-hover:text-red-600 transition-colors text-lg mb-1">
            {job.title}
          </h3>

          {agency && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-2 font-medium">
              <Building2 className="w-4 h-4 shrink-0" />
              {agency.name}
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
            {agency && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {agency.city}, {agency.state_abbr}
              </span>
            )}
            {salaryText !== "Salary not listed" && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {salaryText}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo(job.created_at)}
            </span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-400 transition-colors shrink-0" />
      </div>

      {job.deadline && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
          Apply by{" "}
          <span className="font-medium text-slate-600">
            {new Date(job.deadline).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            })}
          </span>
        </div>
      )}
    </Link>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<(Job & { agencies?: { name: string; city: string; state_abbr: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState<DisciplineType | "">("");
  const [state, setState] = useState("");
  const [empType, setEmpType] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(fetchJobs, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, discipline, state, empType]);

  async function fetchJobs() {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from("jobs")
      .select("*, agencies(name, city, state_abbr)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(40);

    if (query.trim()) q = q.ilike("title", `%${query.trim()}%`);
    if (discipline) q = q.eq("discipline", discipline);
    if (empType) q = q.eq("employment_type", empType);

    const { data } = await q;
    setJobs((data ?? []) as typeof jobs);
    setLoading(false);
  }

  return (
    <div className="page-container py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Job Board</h1>
          <p className="text-slate-500">
            Open positions at public safety agencies across the United States.
          </p>
        </div>
        <Link href="/jobs/post" className="btn-primary">
          <Plus className="w-4 h-4" />
          Post a Job
        </Link>
      </div>

      {/* Search + filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search job titles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className={cn("btn-secondary", showFilters && "bg-slate-100")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100">
            <div>
              <label className="label">Discipline</label>
              <select
                className="input"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as DisciplineType | "")}
              >
                {DISCIPLINES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">State</label>
              <select className="input" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">All States</option>
                {US_STATES.map((s) => (
                  <option key={s.abbr} value={s.abbr}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Employment Type</label>
              <select className="input" value={empType} onChange={(e) => setEmpType(e.target.value)}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-600">No jobs found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
