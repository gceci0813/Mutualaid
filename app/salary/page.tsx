import { createClient } from "@/lib/supabase/server";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS } from "@/lib/utils";
import type { DisciplineType } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";
import { DollarSign, TrendingUp, Users, Briefcase, ArrowRight, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "First Responder Salary Data",
  description:
    "Crowdsourced salary ranges and pay satisfaction scores for police, fire, EMS, and public safety — sourced from verified job listings and anonymous officer reviews.",
};

type DisciplineStats = {
  discipline: DisciplineType;
  avgMin: number;
  avgMax: number;
  jobCount: number;
  avgPayRating: number;
  reviewCount: number;
};

type TopAgency = {
  name: string;
  city: string;
  state: string;
  slug: string;
  avgSalary: number;
  discipline: DisciplineType;
};

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function fmtK(n: number): string {
  if (n <= 0) return "—";
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;
}

function PayBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
      <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SatisfactionBar({ value }: { value: number }) {
  const pct = (value / 5) * 100;
  const color =
    value >= 4 ? "bg-emerald-500" : value >= 3 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function SalaryPage() {
  const supabase = await createClient();

  const [{ data: rawJobs }, { data: rawReviews }] = await Promise.all([
    supabase
      .from("jobs")
      .select("discipline, salary_min, salary_max, salary_type, agencies(name, city, state_abbr, slug, discipline)")
      .eq("active", true)
      .not("salary_min", "is", null)
      .limit(500),
    supabase
      .from("reviews")
      .select("rating_pay, agencies(discipline)")
      .limit(2000),
  ]);

  const jobs = rawJobs ?? [];
  const reviews = rawReviews ?? [];

  // ── Aggregate by discipline ────────────────────────────────────────────────
  const disciplineMap: Record<
    string,
    { salaryMins: number[]; salaryMaxes: number[]; payRatings: number[] }
  > = {};

  for (const job of jobs as any[]) {
    const d = job.discipline as string;
    if (!disciplineMap[d]) disciplineMap[d] = { salaryMins: [], salaryMaxes: [], payRatings: [] };
    const toAnnual = (n: number) =>
      job.salary_type === "hourly" ? Math.round(n * 2080) : n;
    if (job.salary_min) disciplineMap[d].salaryMins.push(toAnnual(job.salary_min));
    if (job.salary_max) disciplineMap[d].salaryMaxes.push(toAnnual(job.salary_max));
  }

  for (const r of reviews as any[]) {
    const d = (r.agencies as any)?.discipline as string | undefined;
    if (!d) continue;
    if (!disciplineMap[d]) disciplineMap[d] = { salaryMins: [], salaryMaxes: [], payRatings: [] };
    if (r.rating_pay) disciplineMap[d].payRatings.push(r.rating_pay);
  }

  const stats: DisciplineStats[] = Object.entries(disciplineMap)
    .map(([d, data]) => ({
      discipline: d as DisciplineType,
      avgMin: avg(data.salaryMins),
      avgMax: avg(data.salaryMaxes),
      jobCount: data.salaryMins.length,
      avgPayRating: avg(data.payRatings),
      reviewCount: data.payRatings.length,
    }))
    .filter((s) => s.avgMin > 0 || s.avgPayRating > 0)
    .sort((a, b) => b.avgMin - a.avgMin);

  // ── Top paying agencies ────────────────────────────────────────────────────
  const agencyMap: Record<string, { name: string; city: string; state: string; slug: string; discipline: DisciplineType; salaries: number[] }> = {};
  for (const job of jobs as any[]) {
    const agency = job.agencies as any;
    if (!agency?.slug || !job.salary_min) continue;
    const toAnnual = (n: number) => job.salary_type === "hourly" ? Math.round(n * 2080) : n;
    if (!agencyMap[agency.slug]) {
      agencyMap[agency.slug] = {
        name: agency.name, city: agency.city, state: agency.state_abbr,
        slug: agency.slug, discipline: agency.discipline, salaries: [],
      };
    }
    agencyMap[agency.slug].salaries.push(toAnnual(job.salary_min));
  }

  const topAgencies: TopAgency[] = Object.values(agencyMap)
    .map((a) => ({ ...a, avgSalary: avg(a.salaries) }))
    .sort((a, b) => b.avgSalary - a.avgSalary)
    .slice(0, 12);

  const totalSalaryPoints = jobs.length;
  const totalReviewPoints = reviews.length;
  const maxSalary = Math.max(...stats.map((s) => s.avgMax), 1);
  const disciplineCount = stats.length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">
              Salary Intelligence
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            First Responder Salaries
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Real salary data from verified job listings + pay satisfaction scores from anonymous officer reviews — across every discipline and state.
          </p>
        </div>
      </div>

      <div className="page-container py-10">
        {/* Hero stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Job salary data points", value: totalSalaryPoints.toLocaleString(), icon: DollarSign, color: "bg-red-50 text-red-600" },
            { label: "Disciplines tracked", value: disciplineCount.toString(), icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
            { label: "Pay satisfaction reviews", value: totalReviewPoints.toLocaleString(), icon: Users, color: "bg-emerald-50 text-emerald-600" },
            { label: "Active job listings", value: totalSalaryPoints.toLocaleString(), icon: Briefcase, color: "bg-amber-50 text-amber-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5 text-center">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-3", color)}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-3xl font-black text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: charts */}
          <div className="lg:col-span-2 space-y-6">

            {/* Salary by discipline */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="font-black text-slate-900 text-lg">Salary by Discipline</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Average annual salary range from active job postings</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-1.5">
                  <Info className="w-3 h-3" />Hourly × 2,080
                </div>
              </div>

              {stats.filter(s => s.avgMin > 0).length === 0 ? (
                <EmptyState icon={DollarSign} message="No salary data yet" sub="Salary data grows as job listings are posted" />
              ) : (
                <div className="space-y-5">
                  {stats.filter(s => s.avgMin > 0).map((s) => (
                    <div key={s.discipline}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("badge text-xs", DISCIPLINE_COLORS[s.discipline])}>
                          {DISCIPLINE_LABELS[s.discipline]}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900">
                            {fmtK(s.avgMin)}
                            {s.avgMax > 0 && <> – {fmtK(s.avgMax)}</>}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">/yr</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PayBar value={s.avgMax} max={maxSalary} color="bg-gradient-to-r from-red-400 to-red-600" />
                        <span className="text-xs text-slate-400 w-20 text-right shrink-0">
                          {s.jobCount} listing{s.jobCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pay satisfaction */}
            <div className="card p-6">
              <div className="mb-5">
                <h2 className="font-black text-slate-900 text-lg">Pay Satisfaction Score</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  How verified officers rate their compensation (1–5 scale) · Green ≥4 · Amber ≥3 · Red &lt;3
                </p>
              </div>

              {stats.filter(s => s.reviewCount > 0).length === 0 ? (
                <EmptyState icon={TrendingUp} message="No review data yet" sub="Pay scores grow as officers write reviews" />
              ) : (
                <div className="space-y-4">
                  {[...stats].filter(s => s.reviewCount > 0)
                    .sort((a, b) => b.avgPayRating - a.avgPayRating)
                    .map((s) => (
                      <div key={s.discipline} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600 w-36 shrink-0 truncate">
                          {DISCIPLINE_LABELS[s.discipline]}
                        </span>
                        <SatisfactionBar value={s.avgPayRating} />
                        <span className={cn(
                          "text-sm font-black w-8 text-right shrink-0",
                          s.avgPayRating >= 4 ? "text-emerald-600" : s.avgPayRating >= 3 ? "text-amber-600" : "text-red-600"
                        )}>
                          {s.avgPayRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400 w-20 text-right shrink-0">
                          {s.reviewCount} review{s.reviewCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Contribute CTA */}
            <div className="card p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base mb-1">Help build the salary database</h3>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                    Every officer who writes a review helps the entire community understand fair pay. Your salary data is aggregated anonymously — no individual data is ever exposed.
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <Link href="/agencies" className="btn-primary text-sm">
                      Write a Review <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link href="/compare" className="btn-dark text-sm">
                      Compare Agencies
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Top paying agencies */}
            <div className="card p-5">
              <h3 className="font-black text-slate-900 text-base mb-1">Top Paying Agencies</h3>
              <p className="text-xs text-slate-400 mb-4">By average listed salary</p>
              {topAgencies.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No data yet</p>
              ) : (
                <div className="space-y-1">
                  {topAgencies.map((agency, i) => (
                    <Link
                      key={agency.slug}
                      href={`/agencies/${agency.slug}`}
                      className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <span className="text-xs font-bold text-slate-300 w-5 shrink-0 text-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-red-600 truncate transition-colors">
                          {agency.name}
                        </p>
                        <p className="text-xs text-slate-400">{agency.city}, {agency.state}</p>
                      </div>
                      <span className="text-sm font-black text-emerald-700 shrink-0">
                        {fmtK(agency.avgSalary)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Methodology */}
            <div className="card p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Data Methodology</h3>
              <ul className="space-y-2.5 text-xs text-slate-500">
                {[
                  "Salary ranges from active department job postings",
                  "Pay satisfaction (1–5) from verified officer reviews",
                  "Hourly rates annualized at 2,080 hrs/year",
                  "No individual salary data is ever shown",
                  "All data is updated in real time",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-red-400 shrink-0 font-bold">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick links */}
            <div className="card p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Explore More</h3>
              <div className="space-y-2">
                {[
                  { href: "/compare", label: "Compare two agencies" },
                  { href: "/agencies?discipline=fire", label: "Fire department salaries" },
                  { href: "/agencies?discipline=police", label: "Law enforcement salaries" },
                  { href: "/agencies?discipline=ems", label: "EMS / paramedic salaries" },
                  { href: "/forum?category=salary", label: "Salary discussion forum" },
                ].map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 hover:bg-slate-50 -mx-2 px-2 py-1.5 rounded-xl transition-colors group">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-400 transition-colors" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyState({ icon: Icon, message, sub }: { icon: React.ComponentType<{ className?: string }>; message: string; sub: string }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-slate-300" />
      </div>
      <p className="font-semibold text-slate-600 mb-1">{message}</p>
      <p className="text-sm text-slate-400">{sub}</p>
    </div>
  );
}
