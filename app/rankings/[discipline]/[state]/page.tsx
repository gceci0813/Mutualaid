import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, ChevronLeft, ChevronRight, Trophy, MapPin } from "lucide-react";
import { cn, DISCIPLINE_LABELS, US_STATES } from "@/lib/utils";
import type { DisciplineType } from "@/types";
import type { Metadata } from "next";

const DISCIPLINES: DisciplineType[] = ["police", "fire", "ems", "dispatch", "dpw", "corrections"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ discipline: string; state: string }>;
}): Promise<Metadata> {
  const { discipline, state } = await params;
  const label = DISCIPLINE_LABELS[discipline as DisciplineType];
  if (!label) return {};
  const stateName = US_STATES.find(s => s.abbr === state.toUpperCase())?.name ?? state.toUpperCase();
  const title = `Best ${label} in ${stateName}`;
  const description = `Rankings of the top-rated ${label.toLowerCase()} in ${stateName}, based on verified anonymous officer reviews.`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function StateRankingsPage({
  params,
}: {
  params: Promise<{ discipline: string; state: string }>;
}) {
  const { discipline, state } = await params;

  if (!DISCIPLINES.includes(discipline as DisciplineType)) notFound();
  const d = discipline as DisciplineType;
  const stateAbbr = state.toUpperCase();
  const stateObj = US_STATES.find(s => s.abbr === stateAbbr);
  if (!stateObj) notFound();

  const supabase = await createClient();

  // Top agencies in this state + discipline
  const { data: agencies } = await supabase
    .from("agencies")
    .select("id, name, slug, city, state_abbr, discipline, avg_overall, review_count, rating_culture, rating_leadership, rating_worklife, rating_pay, rating_equipment")
    .eq("discipline", d)
    .eq("state_abbr", stateAbbr)
    .not("avg_overall", "is", null)
    .gte("review_count", 1)
    .order("avg_overall", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(50);

  // Nearby states for sidebar (same discipline, ordered by review count)
  const { data: allStateData } = await supabase
    .from("agencies")
    .select("state_abbr, review_count")
    .eq("discipline", d)
    .not("review_count", "is", null)
    .gt("review_count", 0)
    .limit(500);

  const stateCounts: Record<string, number> = {};
  (allStateData ?? []).forEach((a) => {
    stateCounts[a.state_abbr] = (stateCounts[a.state_abbr] ?? 0) + (a.review_count ?? 0);
  });
  const nearbyStates = Object.entries(stateCounts)
    .sort(([, a], [, b]) => b - a)
    .filter(([abbr]) => abbr !== stateAbbr)
    .slice(0, 8)
    .map(([abbr]) => abbr);

  const list = agencies ?? [];

  // JSON-LD for this page (ItemList)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${DISCIPLINE_LABELS[d]} in ${stateObj.name}`,
    description: `Top-rated ${DISCIPLINE_LABELS[d].toLowerCase()} in ${stateObj.name} ranked by officer reviews`,
    numberOfItems: list.length,
    itemListElement: list.slice(0, 10).map((agency, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: agency.name,
      url: `https://mutualaid-seven.vercel.app/agencies/${agency.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="page-header">
        <div className="page-header-inner">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-5">
            <Link href="/rankings" className="hover:text-slate-700 transition-colors">Rankings</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/rankings/${d}`} className="hover:text-slate-700 transition-colors">
              {DISCIPLINE_LABELS[d]}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-600 font-medium">{stateObj.name}</span>
          </nav>

          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">State Rankings</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            Best {DISCIPLINE_LABELS[d]}<br className="hidden sm:block" />
            <span className="text-red-600"> in {stateObj.name}</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-xl">
            Top-rated {DISCIPLINE_LABELS[d].toLowerCase()} agencies in {stateObj.name} — ranked by verified, anonymous officer reviews.
          </p>

          {list.length > 0 && (
            <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
              <span>{list.length} ranked {list.length === 1 ? "agency" : "agencies"}</span>
              <span>·</span>
              <span>{list.reduce((sum, a) => sum + (a.review_count ?? 0), 0).toLocaleString()} total reviews</span>
            </div>
          )}
        </div>
      </div>

      <div className="page-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main rankings */}
          <div className="lg:col-span-3">
            {list.length === 0 ? (
              <div className="card p-12 text-center">
                <Trophy className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium mb-1">
                  No ranked {DISCIPLINE_LABELS[d].toLowerCase()} agencies in {stateObj.name} yet
                </p>
                <p className="text-slate-400 text-sm mb-4">
                  Write a review to help rank agencies in your state.
                </p>
                <Link href="/agencies" className="btn-primary inline-flex">Find Your Agency</Link>
              </div>
            ) : (
              <>
                {/* Podium for top 3 */}
                {list.length >= 3 && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {/* 2nd place */}
                    <Link href={`/agencies/${list[1].slug}`} className="card p-4 text-center hover:border-red-200 hover:shadow-sm transition-all group order-1">
                      <p className="text-2xl mb-2">🥈</p>
                      <p className="font-bold text-slate-800 text-xs group-hover:text-red-600 transition-colors line-clamp-2">{list[1].name}</p>
                      <p className="text-xs text-slate-400 mt-1">{list[1].city}</p>
                      <p className="text-sm font-black text-slate-900 mt-2">{list[1].avg_overall?.toFixed(1)}</p>
                      <div className="flex justify-center gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={cn("w-2.5 h-2.5", s <= Math.round(list[1].avg_overall) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
                        ))}
                      </div>
                    </Link>
                    {/* 1st place */}
                    <Link href={`/agencies/${list[0].slug}`} className="card p-4 text-center hover:border-red-200 hover:shadow-md transition-all group border-amber-200 bg-amber-50/30 order-2 -mt-2">
                      <p className="text-2xl mb-2">🥇</p>
                      <p className="font-bold text-slate-800 text-xs group-hover:text-red-600 transition-colors line-clamp-2">{list[0].name}</p>
                      <p className="text-xs text-slate-400 mt-1">{list[0].city}</p>
                      <p className="text-sm font-black text-slate-900 mt-2">{list[0].avg_overall?.toFixed(1)}</p>
                      <div className="flex justify-center gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={cn("w-2.5 h-2.5", s <= Math.round(list[0].avg_overall) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
                        ))}
                      </div>
                      <p className="text-xs text-amber-600 font-bold mt-1">#{1} in {stateObj.name}</p>
                    </Link>
                    {/* 3rd place */}
                    <Link href={`/agencies/${list[2].slug}`} className="card p-4 text-center hover:border-red-200 hover:shadow-sm transition-all group order-3">
                      <p className="text-2xl mb-2">🥉</p>
                      <p className="font-bold text-slate-800 text-xs group-hover:text-red-600 transition-colors line-clamp-2">{list[2].name}</p>
                      <p className="text-xs text-slate-400 mt-1">{list[2].city}</p>
                      <p className="text-sm font-black text-slate-900 mt-2">{list[2].avg_overall?.toFixed(1)}</p>
                      <div className="flex justify-center gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={cn("w-2.5 h-2.5", s <= Math.round(list[2].avg_overall) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
                        ))}
                      </div>
                    </Link>
                  </div>
                )}

                {/* Full ranked list */}
                <div className="space-y-2">
                  {list.map((agency, i) => (
                    <Link
                      key={agency.id}
                      href={`/agencies/${agency.slug}`}
                      className="card p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-sm transition-all group"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                        i === 0 ? "bg-amber-100 text-amber-700" :
                        i === 1 ? "bg-slate-100 text-slate-500" :
                        i === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-slate-50 text-slate-400"
                      )}>
                        #{i + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate text-sm">
                          {agency.name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{agency.city}, {stateAbbr}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex items-center gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={cn(
                              "w-3 h-3",
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
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Other states */}
            {nearbyStates.length > 0 && (
              <div className="card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Other States
                </p>
                <div className="space-y-1">
                  {nearbyStates.map((abbr) => {
                    const sName = US_STATES.find(s => s.abbr === abbr)?.name ?? abbr;
                    return (
                      <Link
                        key={abbr}
                        href={`/rankings/${d}/${abbr}`}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <span className="text-sm text-slate-700 group-hover:text-red-600 transition-colors">{sName}</span>
                        <span className="text-xs font-bold text-slate-400">{abbr}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Nationwide ranking link */}
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Nationwide
              </p>
              <Link
                href={`/rankings/${d}`}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <span className="text-sm text-slate-700 group-hover:text-red-600 transition-colors">
                  Best {DISCIPLINE_LABELS[d]} (US)
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </Link>
              <Link
                href="/rankings"
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <span className="text-sm text-slate-700 group-hover:text-red-600 transition-colors">All Rankings</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </Link>
            </div>

            {/* CTA */}
            <div className="card p-5 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
              <p className="font-bold text-white text-sm mb-2">Don&apos;t see your agency?</p>
              <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                Write a review for your agency to help it appear in {stateObj.name}&apos;s rankings.
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
