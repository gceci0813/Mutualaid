import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, ChevronLeft, ChevronRight, Trophy, MapPin } from "lucide-react";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS, US_STATES } from "@/lib/utils";
import type { DisciplineType } from "@/types";
import type { Metadata } from "next";

const DISCIPLINES: DisciplineType[] = ["police", "fire", "ems", "dispatch", "dpw", "corrections"];

const DISCIPLINE_DESCRIPTIONS: Partial<Record<DisciplineType, string>> = {
  police: "law enforcement agencies and police departments",
  fire: "fire departments and fire rescue services",
  ems: "EMS services, ambulance corps, and emergency medical agencies",
  dispatch: "911 dispatch centers and public safety communications",
  dpw: "public works and municipal services agencies",
  corrections: "correctional facilities and detention agencies",
};

export async function generateStaticParams() {
  return DISCIPLINES.map((d) => ({ discipline: d }));
}

export async function generateMetadata({ params }: { params: Promise<{ discipline: string }> }): Promise<Metadata> {
  const { discipline } = await params;
  const label = DISCIPLINE_LABELS[discipline as DisciplineType];
  if (!label) return {};
  const desc = DISCIPLINE_DESCRIPTIONS[discipline as DisciplineType] ?? label.toLowerCase();
  return {
    title: `Best ${label} — Nationwide Rankings`,
    description: `Rankings of the best ${desc} in the US, based on verified anonymous officer reviews. See top-rated agencies by overall score.`,
  };
}

export default async function DisciplineRankingsPage({ params }: { params: Promise<{ discipline: string }> }) {
  const { discipline } = await params;

  if (!DISCIPLINES.includes(discipline as DisciplineType)) notFound();
  const d = discipline as DisciplineType;

  const supabase = await createClient();

  // Top 50 agencies for this discipline
  const { data: agencies } = await supabase
    .from("agencies")
    .select("id, name, slug, city, state_abbr, discipline, avg_overall, review_count, rating_culture, rating_leadership, rating_worklife, rating_pay, rating_equipment")
    .eq("discipline", d)
    .not("avg_overall", "is", null)
    .gte("review_count", 1)
    .order("avg_overall", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(50);

  // Top states for this discipline
  const { data: stateAgencies } = await supabase
    .from("agencies")
    .select("state_abbr, review_count")
    .eq("discipline", d)
    .not("review_count", "is", null)
    .gt("review_count", 0)
    .limit(500);

  const stateCounts: Record<string, number> = {};
  (stateAgencies ?? []).forEach((a) => {
    stateCounts[a.state_abbr] = (stateCounts[a.state_abbr] ?? 0) + (a.review_count ?? 0);
  });
  const topStates = Object.entries(stateCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([abbr]) => abbr);

  const list = agencies ?? [];

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <Link href="/rankings"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm font-medium mb-5 transition-colors">
            <ChevronLeft className="w-4 h-4" />All Rankings
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">Rankings</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            Best {DISCIPLINE_LABELS[d]}
          </h1>
          <p className="text-slate-500 text-lg max-w-xl">
            Top-ranked {DISCIPLINE_DESCRIPTIONS[d] ?? DISCIPLINE_LABELS[d].toLowerCase()} nationwide — ranked by verified, anonymous officer reviews.
          </p>
        </div>
      </div>

      <div className="page-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main rankings list */}
          <div className="lg:col-span-3">
            {list.length === 0 ? (
              <div className="card p-12 text-center">
                <Trophy className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium mb-1">No ranked agencies yet</p>
                <p className="text-slate-400 text-sm">Be the first to review a {DISCIPLINE_LABELS[d].toLowerCase()} agency.</p>
                <Link href="/agencies" className="btn-primary mt-4 inline-flex">Find Your Agency</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {list.map((agency, i) => (
                  <Link
                    key={agency.id}
                    href={`/agencies/${agency.slug}`}
                    className="card p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-sm transition-all group"
                  >
                    {/* Rank number */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0",
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-slate-100 text-slate-600" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-slate-50 text-slate-400"
                    )}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </div>

                    {/* Agency info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate text-sm">
                        {agency.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{agency.city}, {agency.state_abbr}</span>
                        <span className="text-slate-200">·</span>
                        <Link
                          href={`/rankings/${d}/${agency.state_abbr}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-red-500 transition-colors"
                        >
                          #{stateRankOf(list, agency.id, agency.state_abbr)} in {agency.state_abbr}
                        </Link>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={cn(
                            "w-3.5 h-3.5",
                            s <= Math.round(agency.avg_overall) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
                          )} />
                        ))}
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-sm">{agency.avg_overall?.toFixed(1)}</p>
                        <p className="text-xs text-slate-400">{agency.review_count} reviews</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-red-300 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Browse by state */}
            {topStates.length > 0 && (
              <div className="card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Top States
                </p>
                <div className="space-y-1">
                  {topStates.map((abbr) => {
                    const stateName = US_STATES.find(s => s.abbr === abbr)?.name ?? abbr;
                    return (
                      <Link
                        key={abbr}
                        href={`/rankings/${d}/${abbr}`}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <span className="text-sm text-slate-700 group-hover:text-red-600 transition-colors">{stateName}</span>
                        <span className="text-xs font-bold text-slate-400">{abbr}</span>
                      </Link>
                    );
                  })}
                  <Link
                    href="/agencies"
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group mt-1"
                  >
                    <span className="text-sm text-slate-500 group-hover:text-red-600 transition-colors">All states</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </Link>
                </div>
              </div>
            )}

            {/* Other disciplines */}
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Other Rankings
              </p>
              <div className="space-y-1">
                {DISCIPLINES.filter(x => x !== d).map((other) => (
                  <Link
                    key={other}
                    href={`/rankings/${other}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <span className="text-sm text-slate-700 group-hover:text-red-600 transition-colors">
                      {DISCIPLINE_LABELS[other]}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="card p-5 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
              <p className="font-bold text-white text-sm mb-2">Add your review</p>
              <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                Help rank agencies in your area — anonymous and verified.
              </p>
              <Link href="/agencies" className="btn-primary text-xs w-full justify-center">
                Find Your Agency
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper: rank of an agency within its state in the given list
function stateRankOf(list: { id: string; state_abbr: string }[], agencyId: string, stateAbbr: string): number {
  const stateList = list.filter(a => a.state_abbr === stateAbbr);
  return stateList.findIndex(a => a.id === agencyId) + 1;
}
