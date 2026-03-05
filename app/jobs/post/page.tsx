"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { DisciplineType } from "@/types";

const DISCIPLINES = [
  { value: "police", label: "Law Enforcement" },
  { value: "fire", label: "Fire Department" },
  { value: "ems", label: "EMS / Ambulance" },
  { value: "dispatch", label: "Dispatch / 911" },
  { value: "dpw", label: "Public Works" },
  { value: "corrections", label: "Corrections" },
];

const EMP_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "volunteer", label: "Volunteer" },
  { value: "per_diem", label: "Per Diem" },
];

interface AgencyOption { id: string; name: string; city: string; state_abbr: string }

export default function PostJobPage() {
  const router = useRouter();

  const [agencyQuery, setAgencyQuery] = useState("");
  const [agencyResults, setAgencyResults] = useState<AgencyOption[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<AgencyOption | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");
  const [discipline, setDiscipline] = useState<DisciplineType>("police");
  const [empType, setEmpType] = useState("full_time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryType, setSalaryType] = useState<"hourly" | "annual">("annual");
  const [deadline, setDeadline] = useState("");
  const [applyUrl, setApplyUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (agencyQuery.trim().length < 2) {
      setAgencyResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("agencies")
        .select("id, name, city, state_abbr")
        .ilike("name", `%${agencyQuery.trim()}%`)
        .limit(8);
      setAgencyResults((data as AgencyOption[]) ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [agencyQuery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAgency) {
      setError("Please select an agency.");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/jobs/post");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("jobs")
      .insert({
        agency_id: selectedAgency.id,
        posted_by_user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        requirements: requirements.trim() || null,
        benefits: benefits.trim() || null,
        discipline,
        employment_type: empType,
        salary_min: salaryMin ? parseFloat(salaryMin) : null,
        salary_max: salaryMax ? parseFloat(salaryMax) : null,
        salary_type: salaryType,
        external_apply_url: applyUrl.trim() || null,
        deadline: deadline || null,
        active: true,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/jobs/${data.id}`);
  }

  return (
    <div className="page-container py-10 max-w-3xl">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to jobs
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Post a Job</h1>
      <p className="text-slate-500 text-sm mb-8">
        Post open positions for your department. Must be a verified department representative.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Agency selection */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Select Agency</h2>

          {selectedAgency ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div>
                <p className="font-semibold text-green-800">{selectedAgency.name}</p>
                <p className="text-sm text-green-600">{selectedAgency.city}, {selectedAgency.state_abbr}</p>
              </div>
              <button
                type="button"
                className="text-xs text-green-600 hover:text-green-800 underline"
                onClick={() => { setSelectedAgency(null); setAgencyQuery(""); }}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Search your department name..."
                value={agencyQuery}
                onChange={(e) => setAgencyQuery(e.target.value)}
              />
              {agencyResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 card z-10 py-1 max-h-60 overflow-y-auto">
                  {agencyResults.map((agency) => (
                    <button
                      key={agency.id}
                      type="button"
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
                      onClick={() => {
                        setSelectedAgency(agency);
                        setAgencyQuery(agency.name);
                        setAgencyResults([]);
                      }}
                    >
                      <span className="font-medium text-sm text-slate-900">{agency.name}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        {agency.city}, {agency.state_abbr}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Position details */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Position Details</h2>

          <div>
            <label className="label">Job Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Firefighter / Paramedic"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Discipline <span className="text-red-500">*</span></label>
              <select
                className="input"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as DisciplineType)}
              >
                {DISCIPLINES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Employment Type <span className="text-red-500">*</span></label>
              <div className="flex gap-2 flex-wrap">
                {EMP_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setEmpType(t.value)}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                      empType === t.value
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Job Description <span className="text-red-500">*</span></label>
            <textarea
              className="input min-h-[140px] resize-y"
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={100}
            />
          </div>

          <div>
            <label className="label">Requirements & Qualifications</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="List required certifications, experience, etc."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Benefits</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Health insurance, pension, uniform allowance..."
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
            />
          </div>
        </div>

        {/* Salary */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Compensation (optional)</h2>
          <div className="flex gap-3 mb-4">
            {(["annual", "hourly"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSalaryType(t)}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors",
                  salaryType === t
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Minimum {salaryType === "annual" ? "Salary" : "Hourly Rate"}</label>
              <input
                type="number"
                className="input"
                placeholder={salaryType === "annual" ? "e.g. 55000" : "e.g. 25.00"}
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="label">Maximum {salaryType === "annual" ? "Salary" : "Hourly Rate"}</label>
              <input
                type="number"
                className="input"
                placeholder={salaryType === "annual" ? "e.g. 80000" : "e.g. 35.00"}
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Apply & deadline */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Application Info</h2>
          <div>
            <label className="label">External Application URL <span className="text-red-500">*</span></label>
            <input
              type="url"
              className="input"
              placeholder="https://your-department.gov/careers/apply"
              value={applyUrl}
              onChange={(e) => setApplyUrl(e.target.value)}
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Link to your department&apos;s official application portal.
            </p>
          </div>
          <div>
            <label className="label">Application Deadline (optional)</label>
            <input
              type="date"
              className="input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Posting..." : "Post Job Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
