"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, Star, Users, Briefcase, Filter, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS, US_STATES } from "@/lib/utils";
import type { Agency, DisciplineType } from "@/types";

const TABS: { value: DisciplineType | "" | "federal"; label: string; emoji: string }[] = [
  { value: "",           label: "All",          emoji: "🔍" },
  { value: "fire",       label: "Fire",         emoji: "🚒" },
  { value: "police",     label: "Police / PD",  emoji: "👮" },
  { value: "ems",        label: "EMS",          emoji: "🚑" },
  { value: "federal",    label: "Federal",      emoji: "🏛️" },
  { value: "dispatch",   label: "Dispatch",     emoji: "📡" },
  { value: "corrections",label: "Corrections",  emoji: "🔒" },
];

const FEDERAL_DISCIPLINES: DisciplineType[] = ["fbi", "dhs"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn("w-3.5 h-3.5", s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
      ))}
      <span className="text-xs font-semibold text-slate-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function AgenciesBrowser() {
  const searchParams = useSearchParams();
  const initialDiscipline = (searchParams.get("discipline") as DisciplineType | "") ?? "";
  const initialTab: DisciplineType | "" | "federal" =
    initialDiscipline === "fbi" || initialDiscipline === "dhs" ? "federal" : initialDiscipline;

  const [activeTab, setActiveTab] = useState<DisciplineType | "" | "federal">(initialTab);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [state, setState] = useState(searchParams.get("state") ?? "");
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(!!searchParams.get("state"));

  const disciplineFilter = useMemo<DisciplineType | DisciplineType[] | "">(() => {
    if (activeTab === "federal") return FEDERAL_DISCIPLINES;
    return activeTab as DisciplineType | "";
  }, [activeTab]);

  useEffect(() => {
    const timeout = setTimeout(fetchAgencies, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disciplineFilter, state, query]);

  async function fetchAgencies() {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("agencies").select("*").order("review_count", { ascending: false }).limit(48);
    if (query.trim()) q = q.ilike("name", `%${query.trim()}%`);
    if (Array.isArray(disciplineFilter)) q = q.in("discipline", disciplineFilter);
    else if (disciplineFilter) q = q.eq("discipline", disciplineFilter);
    if (state) q = q.eq("state_abbr", state);
    const { data } = await q;
    setAgencies((data as Agency[]) ?? []);
    setLoading(false);
  }

  return (
    <div>
      {/* Discipline tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setQuery(""); setState(""); }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
              activeTab === tab.value
                ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
            )}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by agency name..."
              className="input pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className={cn("btn-secondary", showFilters && "bg-slate-100 border-slate-300")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            {state ? `State: ${state}` : "Filter by State"}
          </button>
        </div>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 max-w-xs">
            <label className="label">State</label>
            <select className="input" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">All States</option>
              {US_STATES.map((s) => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-36">
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : agencies.length === 0 ? (
        <div className="card p-16 text-center text-slate-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-600 mb-1">No agencies found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agencies.map((agency) => (
            <Link
              key={agency.id}
              href={`/agencies/${agency.slug}`}
              className="card p-5 hover:border-red-200 hover:shadow-lg transition-all group flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug text-sm flex-1">
                  {agency.name}
                </h3>
                <span className={cn("badge shrink-0 text-[10px]", DISCIPLINE_COLORS[agency.discipline])}>
                  {DISCIPLINE_LABELS[agency.discipline].split(" ")[0]}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                <MapPin className="w-3 h-3 shrink-0" />
                {agency.city}, {agency.state_abbr}
              </div>

              <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                <div>
                  {agency.avg_overall ? (
                    <StarRating rating={agency.avg_overall} />
                  ) : (
                    <span className="text-xs text-slate-400">No reviews yet</span>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {agency.review_count ?? 0}
                    </span>
                    {(agency.open_job_count ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <Briefcase className="w-3 h-3" />
                        {agency.open_job_count} open
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
