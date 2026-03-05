"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin, Star, Users, Briefcase, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS, US_STATES } from "@/lib/utils";
import type { Agency, DisciplineType } from "@/types";

const DISCIPLINES: { value: DisciplineType | ""; label: string }[] = [
  { value: "", label: "All Disciplines" },
  { value: "police", label: "Law Enforcement" },
  { value: "fire", label: "Fire Department" },
  { value: "ems", label: "EMS / Ambulance" },
  { value: "dispatch", label: "Dispatch / 911" },
  { value: "dpw", label: "Public Works" },
  { value: "fbi", label: "FBI" },
  { value: "dhs", label: "DHS / Homeland Security" },
  { value: "corrections", label: "Corrections" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "w-3.5 h-3.5",
            s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
          )}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function AgenciesBrowser() {
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState<DisciplineType | "">("");
  const [state, setState] = useState("");
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(fetchAgencies, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, discipline, state]);

  async function fetchAgencies() {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from("agencies")
      .select("*")
      .order("review_count", { ascending: false })
      .limit(48);

    if (query.trim()) q = q.ilike("name", `%${query.trim()}%`);
    if (discipline) q = q.eq("discipline", discipline);
    if (state) q = q.eq("state_abbr", state);

    const { data } = await q;
    setAgencies((data as Agency[]) ?? []);
    setLoading(false);
  }

  return (
    <div>
      {/* Search + filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by department name..."
              className="input pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className={cn("btn-secondary gap-2", showFilters && "bg-slate-100")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
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
              <select
                className="input"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                <option value="">All States</option>
                {US_STATES.map((s) => (
                  <option key={s.abbr} value={s.abbr}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : agencies.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No agencies found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agencies.map((agency) => (
            <Link
              key={agency.id}
              href={`/agencies/${agency.slug}`}
              className="card p-5 hover:border-red-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
                  {agency.name}
                </h3>
                <span className={cn("badge shrink-0", DISCIPLINE_COLORS[agency.discipline])}>
                  {DISCIPLINE_LABELS[agency.discipline].split(" ")[0]}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {agency.city}, {agency.state_abbr}
              </div>

              {agency.avg_overall ? (
                <div className="mb-3">
                  <StarRating rating={agency.avg_overall} />
                </div>
              ) : null}

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {agency.review_count ?? 0} review{agency.review_count !== 1 ? "s" : ""}
                </span>
                {(agency.open_job_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <Briefcase className="w-3 h-3" />
                    {agency.open_job_count} open job{agency.open_job_count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
