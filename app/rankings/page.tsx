import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Star, ChevronRight, Trophy, TrendingUp } from "lucide-react";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS, US_STATES } from "@/lib/utils";
import type { DisciplineType } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best & Top-Rated Public Safety Agencies",
  description:
    "Rankings of the best police departments, fire departments, EMS services, and public safety agencies across the US — based on verified anonymous officer reviews.",
};

const DISCIPLINE_EMOJIS: Partial<Record<DisciplineType, string>> = {
  police: "👮", fire: "🚒", ems: "🚑", dispatch: "📡", corrections: "🔒",
};

type TopAgency = {
  id: string; name: string; slug: string; city: string; state_abbr: string;
  discipline: DisciplineType; avg_overall: number; review_count: number;
};

export default async function RankingsPage() {
  const supabase = await createClient();

  const DISCIPLINES: DisciplineType[] = ["police", "fire", "ems", "dispatch", "corrections"];

  // Fetch top agency per discipline
  const disciplineLeaders = await Promise.all(
    DISCIPLINES.map(async (d) => {
      const { data } = await supabase
        .from("agencies")
        .select("id, name, slug, city, state_abbr, discipline, avg_overall, review_count")
        .eq("discipline", d)
        .not("avg_overall", "is", null)
        .gte("review_count", 1)
        .order("avg_overall", { ascending: false })
        .limit(1);
      return { discipline: d, top: data?.[0] as TopAgency | undefined };
    })
  );

  // Featured states (most reviews overall)
  const { data: stateData } = await supabase
    .from("agencies")
    .select("state_abbr, review_count")
    .not("review_count", "is", null)
    .gt("review_count", 0)
    .limit(500);

  const stateCounts: Record<string, number> = {};
  (stateData ?? []).forEach((a) => {
    stateCounts[a.state_abbr] = (stateCounts[a.state_abbr] ?? 0) + (a.review_count ?? 0);
  });
  const topStates = Object.entries(stateCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([abbr]) => abbr);

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">Rankings</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">Agency Rankings</h1>
          <p className="text-slate-500 text-lg max-w-xl">
            The best-rated public safety agencies in the US — ranked by verified, anonymous officer reviews.
          </p>
        </div>
      </div>

      <div className="page-container py-10">

        {/* By Discipline */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-slate-900 mb-1">Browse by Discipline</h2>
          <p className="text-slate-500 text-sm mb-6">Top-rated agencies, filtered by type</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {disciplineLeaders.map(({ discipline, top }) => (
              <Link
                key={discipline}
                href={`/rankings/${discipline}`}
                className="card p-5 hover:border-red-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{DISCIPLINE_EMOJIS[discipline] ?? "🏛️"}</span>
                    <div>
                      <p className="font-black text-slate-900 group-hover:text-red-600 transition-colors">
                        {DISCIPLINE_LABELS[discipline]}
                      </p>
                      <p className="text-xs text-slate-400">Nationwide rankings</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-400 transition-colors shrink-0 mt-1" />
                </div>
                {top ? (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">#1 Ranked</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{top.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={cn("w-3 h-3", s <= Math.round(top.avg_overall) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-600">{top.avg_overall.toFixed(1)}</span>
                      <span className="text-xs text-slate-400">· {top.review_count} reviews</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3">No ranked agencies yet</p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* By State */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-slate-900 mb-1">Browse by State</h2>
          <p className="text-slate-500 text-sm mb-6">Most-reviewed states</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {topStates.map((abbr) => {
              const stateName = US_STATES.find(s => s.abbr === abbr)?.name ?? abbr;
              return (
                <Link
                  key={abbr}
                  href={`/rankings/police/${abbr}`}
                  className="card p-4 text-center hover:border-red-200 hover:shadow-sm transition-all group"
                >
                  <p className="text-lg font-black text-slate-900 group-hover:text-red-600 transition-colors">{abbr}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{stateName}</p>
                </Link>
              );
            })}
            <Link href="/agencies" className="card p-4 text-center hover:border-red-200 hover:shadow-sm transition-all group flex items-center justify-center">
              <div>
                <p className="text-sm font-bold text-slate-500 group-hover:text-red-600 transition-colors">All States</p>
                <ChevronRight className="w-4 h-4 text-slate-300 mx-auto mt-0.5" />
              </div>
            </Link>
          </div>
        </div>

        {/* Quick stat card */}
        <div className="card p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="font-black text-white text-base mb-1">Don&apos;t see your agency ranked?</p>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Rankings are based on verified officer reviews. Write a review for your agency to help it appear in these rankings — and help other officers make informed decisions.
              </p>
              <Link href="/agencies" className="btn-primary text-sm">Find Your Agency</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
