"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, ArrowRight, Star, Users, Briefcase, TrendingUp, Shield, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS } from "@/lib/utils";
import type { Agency, DisciplineType } from "@/types";

type AgencyWithStats = Agency & {
  avg_culture?: number;
  avg_leadership?: number;
  avg_worklife?: number;
  avg_pay?: number;
  avg_equipment?: number;
};

const RATING_FIELDS = [
  { key: "avg_overall",    label: "Overall Rating" },
  { key: "avg_culture",    label: "Work Culture" },
  { key: "avg_leadership", label: "Leadership" },
  { key: "avg_worklife",   label: "Work-Life Balance" },
  { key: "avg_pay",        label: "Pay & Benefits" },
  { key: "avg_equipment",  label: "Equipment" },
] as const;

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn("w-3.5 h-3.5",
          s <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
      ))}
    </div>
  );
}

function AgencySearch({
  label,
  selected,
  onSelect,
  exclude,
}: {
  label: string;
  selected: AgencyWithStats | null;
  onSelect: (a: AgencyWithStats | null) => void;
  exclude?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AgencyWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      let q = supabase.from("agencies").select("*").ilike("name", `%${query.trim()}%`).limit(8);
      if (exclude) q = q.neq("id", exclude);
      const { data } = await q;
      setResults((data as AgencyWithStats[]) ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query, exclude]);

  if (selected) {
    return (
      <div className="card p-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm truncate">{selected.name}</p>
          <p className="text-xs text-slate-400">{selected.city}, {selected.state_abbr}</p>
        </div>
        <button onClick={() => onSelect(null)} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <label className="label">{label}</label>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="input pl-10"
          placeholder="Search by agency name..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1.5 card shadow-lg border-slate-200 overflow-hidden">
          {results.map((a) => (
            <button
              key={a.id}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
              onClick={() => { onSelect(a); setQuery(""); setOpen(false); }}
            >
              <span className={cn("badge text-[10px] shrink-0", DISCIPLINE_COLORS[a.discipline])}>
                {DISCIPLINE_LABELS[a.discipline].split(" ")[0]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{a.name}</p>
                <p className="text-xs text-slate-400">{a.city}, {a.state_abbr}</p>
              </div>
              {a.avg_overall && (
                <span className="text-xs font-bold text-amber-600 shrink-0">★ {a.avg_overall.toFixed(1)}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && results.length === 0 && !loading && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1.5 card shadow-lg p-4 text-center text-sm text-slate-400">
          No agencies found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}

function ComparisonRow({
  label,
  a,
  b,
  fieldKey,
}: {
  label: string;
  a: AgencyWithStats;
  b: AgencyWithStats;
  fieldKey: string;
}) {
  const valA = (a as any)[fieldKey] as number | undefined;
  const valB = (b as any)[fieldKey] as number | undefined;
  const hasA = valA != null && valA > 0;
  const hasB = valB != null && valB > 0;
  const aWins = hasA && hasB && valA > valB;
  const bWins = hasA && hasB && valB > valA;

  return (
    <div className="grid grid-cols-3 gap-4 items-center py-3.5 border-b border-slate-50 last:border-0">
      <div className={cn(
        "text-center p-3 rounded-xl transition-colors",
        aWins ? "bg-emerald-50" : "bg-slate-50"
      )}>
        {hasA ? (
          <>
            <p className={cn("text-lg font-black", aWins ? "text-emerald-700" : "text-slate-700")}>{valA!.toFixed(1)}</p>
            <StarRow value={valA!} />
          </>
        ) : (
          <p className="text-sm text-slate-300 font-medium">No data</p>
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      </div>
      <div className={cn(
        "text-center p-3 rounded-xl transition-colors",
        bWins ? "bg-emerald-50" : "bg-slate-50"
      )}>
        {hasB ? (
          <>
            <p className={cn("text-lg font-black", bWins ? "text-emerald-700" : "text-slate-700")}>{valB!.toFixed(1)}</p>
            <StarRow value={valB!} />
          </>
        ) : (
          <p className="text-sm text-slate-300 font-medium">No data</p>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, a, b }: { label: string; a: string | number; b: string | number }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-slate-50 last:border-0">
      <p className="text-center text-sm font-bold text-slate-800">{a}</p>
      <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-center text-sm font-bold text-slate-800">{b}</p>
    </div>
  );
}

export default function ComparePage() {
  const [agencyA, setAgencyA] = useState<AgencyWithStats | null>(null);
  const [agencyB, setAgencyB] = useState<AgencyWithStats | null>(null);
  const [detailA, setDetailA] = useState<AgencyWithStats | null>(null);
  const [detailB, setDetailB] = useState<AgencyWithStats | null>(null);

  // Fetch full review stats when agencies are selected
  useEffect(() => {
    if (!agencyA) { setDetailA(null); return; }
    async function fetch() {
      const supabase = createClient();
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating_overall, rating_culture, rating_leadership, rating_worklife, rating_pay, rating_equipment")
        .eq("agency_id", agencyA!.id);
      if (!reviews?.length) { setDetailA(agencyA); return; }
      const avg = (key: string) => reviews.reduce((s, r: any) => s + (r[key] || 0), 0) / reviews.length;
      setDetailA({
        ...agencyA!,
        avg_overall: avg("rating_overall"),
        avg_culture: avg("rating_culture"),
        avg_leadership: avg("rating_leadership"),
        avg_worklife: avg("rating_worklife"),
        avg_pay: avg("rating_pay"),
        avg_equipment: avg("rating_equipment"),
        review_count: reviews.length,
      });
    }
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyA?.id]);

  useEffect(() => {
    if (!agencyB) { setDetailB(null); return; }
    async function fetch() {
      const supabase = createClient();
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating_overall, rating_culture, rating_leadership, rating_worklife, rating_pay, rating_equipment")
        .eq("agency_id", agencyB!.id);
      if (!reviews?.length) { setDetailB(agencyB); return; }
      const avg = (key: string) => reviews.reduce((s, r: any) => s + (r[key] || 0), 0) / reviews.length;
      setDetailB({
        ...agencyB!,
        avg_overall: avg("rating_overall"),
        avg_culture: avg("rating_culture"),
        avg_leadership: avg("rating_leadership"),
        avg_worklife: avg("rating_worklife"),
        avg_pay: avg("rating_pay"),
        avg_equipment: avg("rating_equipment"),
        review_count: reviews.length,
      });
    }
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyB?.id]);

  const bothSelected = !!detailA && !!detailB;

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">Agency Compare</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">Compare Agencies</h1>
          <p className="text-slate-500 text-lg max-w-xl">
            Side-by-side comparison of ratings, culture, pay, and more — based on verified officer reviews.
          </p>
        </div>
      </div>

      <div className="page-container py-10 max-w-4xl">
        {/* Agency pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <div>
            <AgencySearch label="Agency A" selected={agencyA} onSelect={setAgencyA} exclude={agencyB?.id} />
          </div>
          <div>
            <AgencySearch label="Agency B" selected={agencyB} onSelect={setAgencyB} exclude={agencyA?.id} />
          </div>
        </div>

        {/* Empty state */}
        {!agencyA && !agencyB && (
          <div className="card p-16 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-slate-300" />
            </div>
            <p className="font-bold text-slate-700 mb-2 text-lg">Pick two agencies to compare</p>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
              Search for any two departments. We&apos;ll show you a full side-by-side breakdown of ratings, culture, pay, and open jobs.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/agencies" className="btn-primary">Browse All Agencies</Link>
              <Link href="/salary" className="btn-secondary">View Salary Data</Link>
            </div>
          </div>
        )}

        {/* Waiting for second selection */}
        {(agencyA || agencyB) && !bothSelected && (
          <div className="card p-10 text-center">
            <p className="text-slate-400 text-sm">
              {agencyA ? `Now select Agency B to compare with ${agencyA.name}` : `Now select Agency A`}
            </p>
          </div>
        )}

        {/* Comparison table */}
        {bothSelected && detailA && detailB && (
          <div className="space-y-5">
            {/* Header row with agency names */}
            <div className="card p-4">
              <div className="grid grid-cols-3 gap-4 items-center">
                <Link href={`/agencies/${detailA.slug}`}
                  className="card p-4 hover:border-red-200 transition-colors group text-center">
                  <span className={cn("badge text-xs mb-2 inline-flex", DISCIPLINE_COLORS[detailA.discipline])}>
                    {DISCIPLINE_LABELS[detailA.discipline].split(" ")[0]}
                  </span>
                  <p className="font-black text-slate-900 text-sm leading-snug group-hover:text-red-600 transition-colors">
                    {detailA.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{detailA.city}, {detailA.state_abbr}</p>
                  <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-1.5">
                    <ChevronRight className="w-3 h-3" />View profile
                  </p>
                </Link>
                <div className="text-center">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">vs</p>
                </div>
                <Link href={`/agencies/${detailB.slug}`}
                  className="card p-4 hover:border-red-200 transition-colors group text-center">
                  <span className={cn("badge text-xs mb-2 inline-flex", DISCIPLINE_COLORS[detailB.discipline])}>
                    {DISCIPLINE_LABELS[detailB.discipline].split(" ")[0]}
                  </span>
                  <p className="font-black text-slate-900 text-sm leading-snug group-hover:text-red-600 transition-colors">
                    {detailB.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{detailB.city}, {detailB.state_abbr}</p>
                  <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-1.5">
                    <ChevronRight className="w-3 h-3" />View profile
                  </p>
                </Link>
              </div>
            </div>

            {/* Quick stats */}
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Quick Stats</p>
              <StatRow
                label="Total Reviews"
                a={`${detailA.review_count ?? 0} reviews`}
                b={`${detailB.review_count ?? 0} reviews`}
              />
              <StatRow
                label="Open Jobs"
                a={`${detailA.open_job_count ?? 0} open`}
                b={`${detailB.open_job_count ?? 0} open`}
              />
              <StatRow
                label="Employees"
                a={detailA.employee_count ? `~${detailA.employee_count.toLocaleString()}` : "Unknown"}
                b={detailB.employee_count ? `~${detailB.employee_count.toLocaleString()}` : "Unknown"}
              />
            </div>

            {/* Ratings comparison */}
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 text-center">
                Ratings Comparison
              </p>
              <p className="text-xs text-slate-400 text-center mb-4">
                Green highlight = higher score
              </p>
              {RATING_FIELDS.map(({ key, label }) => (
                <ComparisonRow
                  key={key}
                  label={label}
                  a={detailA}
                  b={detailB}
                  fieldKey={key === "avg_overall" ? "avg_overall" : key}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link href={`/agencies/${detailA.slug}/reviews/new`} className="btn-primary w-full justify-center">
                Review {detailA.name.split(" ")[0]}
              </Link>
              <Link href={`/agencies/${detailB.slug}/reviews/new`} className="btn-primary w-full justify-center">
                Review {detailB.name.split(" ")[0]}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
