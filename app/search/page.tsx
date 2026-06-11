import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Search, Building2, Briefcase, MessageSquare, MapPin, Star, ChevronRight } from "lucide-react";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS } from "@/lib/utils";
import type { DisciplineType } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search — MutualAid",
  description: "Search agencies, jobs, and forum discussions on MutualAid.",
  robots: { index: false },
};

type SearchParams = Promise<{ q?: string; type?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", type = "all" } = await searchParams;
  const query = q.trim();

  if (!query) {
    return <EmptySearch />;
  }

  const supabase = await createClient();
  const searchTerm = `%${query}%`;

  // Run all three searches in parallel
  const [agencyRes, jobRes, threadRes] = await Promise.all([
    type === "jobs" || type === "forum" ? { data: [] } :
      supabase
        .from("agencies")
        .select("id, name, slug, city, state_abbr, discipline, avg_overall, review_count")
        .or(`name.ilike.${searchTerm},city.ilike.${searchTerm}`)
        .order("review_count", { ascending: false })
        .limit(10),

    type === "agencies" || type === "forum" ? { data: [] } :
      supabase
        .from("jobs")
        .select("id, title, discipline, employment_type, created_at, agencies(name, city, state_abbr, slug)")
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10),

    type === "agencies" || type === "jobs" ? { data: [] } :
      supabase
        .from("threads")
        .select("id, title, category, upvotes, comment_count, created_at, anonymous_alias")
        .or(`title.ilike.${searchTerm},body.ilike.${searchTerm}`)
        .order("upvotes", { ascending: false })
        .limit(10),
  ]);

  const agencies = (agencyRes.data ?? []) as {
    id: string; name: string; slug: string; city: string; state_abbr: string;
    discipline: DisciplineType; avg_overall: number; review_count: number;
  }[];
  const jobs = (jobRes.data ?? []) as unknown as {
    id: string; title: string; discipline: DisciplineType; employment_type: string; created_at: string;
    agencies: { name: string; city: string; state_abbr: string; slug: string } | null;
  }[];
  const threads = (threadRes.data ?? []) as {
    id: string; title: string; category: string; upvotes: number; comment_count: number;
    created_at: string; anonymous_alias: string;
  }[];

  const totalResults = agencies.length + jobs.length + threads.length;

  function timeAgo(dateStr: string): string {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">Search</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">
            Results for &ldquo;{query}&rdquo;
          </h1>
          <p className="text-slate-500 text-sm">
            {totalResults === 0 ? "No results found." : `${totalResults} result${totalResults !== 1 ? "s" : ""} across agencies, jobs, and forum`}
          </p>
        </div>
      </div>

      <div className="page-container py-10">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {[
            { key: "all", label: "All Results", count: totalResults },
            { key: "agencies", label: "Agencies", count: agencies.length },
            { key: "jobs", label: "Jobs", count: jobs.length },
            { key: "forum", label: "Forum", count: threads.length },
          ].map(({ key, label, count }) => (
            <Link
              key={key}
              href={`/search?q=${encodeURIComponent(query)}&type=${key}`}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
                (type === key || (key === "all" && type !== "agencies" && type !== "jobs" && type !== "forum"))
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {label}
              {count > 0 && <span className="ml-1.5 opacity-75">({count})</span>}
            </Link>
          ))}
        </div>

        {totalResults === 0 && (
          <div className="card p-12 text-center">
            <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium mb-1">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-slate-400 text-sm">Try a different search term, or browse by discipline.</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Link href="/agencies" className="btn-secondary text-sm">Browse Agencies</Link>
              <Link href="/forum" className="btn-secondary text-sm">Browse Forum</Link>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Agencies */}
          {agencies.length > 0 && (
            <section>
              <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Agencies
                <span className="text-slate-400 font-normal text-sm">({agencies.length})</span>
              </h2>
              <div className="space-y-2">
                {agencies.map((agency) => (
                  <Link
                    key={agency.id}
                    href={`/agencies/${agency.slug}`}
                    className="card p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate text-sm">
                          {agency.name}
                        </p>
                        <span className={cn("badge text-xs shrink-0", DISCIPLINE_COLORS[agency.discipline])}>
                          {DISCIPLINE_LABELS[agency.discipline]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{agency.city}, {agency.state_abbr}</span>
                      </div>
                    </div>
                    {agency.avg_overall ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-slate-900">{agency.avg_overall.toFixed(1)}</span>
                        <span className="text-xs text-slate-400">({agency.review_count})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 shrink-0">No reviews</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-red-300 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Jobs */}
          {jobs.length > 0 && (
            <section>
              <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-400" />
                Jobs
                <span className="text-slate-400 font-normal text-sm">({jobs.length})</span>
              </h2>
              <div className="space-y-2">
                {jobs.map((job) => {
                  const agency = job.agencies as { name: string; city: string; state_abbr: string; slug: string } | null;
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="card p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-sm transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate text-sm">
                            {job.title}
                          </p>
                          <span className={cn("badge text-xs shrink-0", DISCIPLINE_COLORS[job.discipline])}>
                            {DISCIPLINE_LABELS[job.discipline]}
                          </span>
                        </div>
                        {agency && (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Building2 className="w-3 h-3" />
                            <span>{agency.name}</span>
                            <span className="text-slate-200">·</span>
                            <MapPin className="w-3 h-3" />
                            <span>{agency.city}, {agency.state_abbr}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-400">{timeAgo(job.created_at)}</p>
                        <p className="text-xs text-slate-500 capitalize mt-0.5">{job.employment_type.replace("_", " ")}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-red-300 transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Forum threads */}
          {threads.length > 0 && (
            <section>
              <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Forum
                <span className="text-slate-400 font-normal text-sm">({threads.length})</span>
              </h2>
              <div className="space-y-2">
                {threads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/forum/${thread.id}`}
                    className="card p-4 hover:border-red-200 hover:shadow-sm transition-all group"
                  >
                    <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors text-sm mb-1">
                      {thread.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{thread.anonymous_alias}</span>
                      <span>·</span>
                      <span>{timeAgo(thread.created_at)}</span>
                      <span>·</span>
                      <span>{thread.upvotes} upvotes</span>
                      <span>·</span>
                      <span>{thread.comment_count} comments</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function EmptySearch() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-bold uppercase tracking-widest">Search</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">Search MutualAid</h1>
          <p className="text-slate-500 text-lg max-w-xl">
            Find agencies, open positions, and forum discussions across the platform.
          </p>
        </div>
      </div>

      <div className="page-container py-10 max-w-2xl">
        <SearchForm />
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/agencies" className="card p-5 hover:border-red-200 hover:shadow-sm transition-all group text-center">
            <Building2 className="w-6 h-6 text-slate-300 group-hover:text-red-400 mx-auto mb-2 transition-colors" />
            <p className="font-bold text-slate-700 group-hover:text-red-600 transition-colors text-sm">Browse Agencies</p>
            <p className="text-xs text-slate-400 mt-0.5">Reviews & ratings</p>
          </Link>
          <Link href="/jobs" className="card p-5 hover:border-red-200 hover:shadow-sm transition-all group text-center">
            <Briefcase className="w-6 h-6 text-slate-300 group-hover:text-red-400 mx-auto mb-2 transition-colors" />
            <p className="font-bold text-slate-700 group-hover:text-red-600 transition-colors text-sm">Browse Jobs</p>
            <p className="text-xs text-slate-400 mt-0.5">Open positions</p>
          </Link>
          <Link href="/forum" className="card p-5 hover:border-red-200 hover:shadow-sm transition-all group text-center">
            <MessageSquare className="w-6 h-6 text-slate-300 group-hover:text-red-400 mx-auto mb-2 transition-colors" />
            <p className="font-bold text-slate-700 group-hover:text-red-600 transition-colors text-sm">Browse Forum</p>
            <p className="text-xs text-slate-400 mt-0.5">Discussions & advice</p>
          </Link>
        </div>
      </div>
    </>
  );
}

function SearchForm() {
  return (
    <form action="/search" method="GET" className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      <input
        type="text"
        name="q"
        autoFocus
        placeholder="Search agencies, jobs, forum..."
        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
      />
      <button
        type="submit"
        className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary py-2 text-sm"
      >
        Search
      </button>
    </form>
  );
}
