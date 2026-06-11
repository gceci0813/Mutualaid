import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, MessageSquare, ThumbsUp, Pin, MapPin } from "lucide-react";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS } from "@/lib/utils";
import type { Agency, Thread } from "@/types";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: agency } = await supabase.from("agencies").select("name").eq("slug", slug).single();
  if (!agency) return {};
  return {
    title: `${agency.name} Forum & Discussions`,
    description: `Anonymous discussions about ${agency.name} from verified officers.`,
  };
}

function timeAgo(dateStr: string): string {
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default async function AgencyForumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: agencyData } = await supabase.from("agencies").select("*").eq("slug", slug).single();
  if (!agencyData) notFound();
  const agency = agencyData as Agency;

  const { data: threadData } = await supabase
    .from("threads")
    .select("*")
    .eq("agency_id", agency.id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  const threads = (threadData ?? []) as Thread[];

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <nav className="flex items-center gap-1.5 text-sm mb-5">
            <Link href="/agencies" className="text-slate-400 hover:text-slate-600 transition-colors">Agencies</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link href={`/agencies/${slug}`} className="text-slate-400 hover:text-slate-600 transition-colors">{agency.name}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-700 font-medium">Forum</span>
          </nav>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <span className={cn("badge mb-3", DISCIPLINE_COLORS[agency.discipline])}>
                {DISCIPLINE_LABELS[agency.discipline]}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">{agency.name}</h1>
              <p className="flex items-center gap-1.5 text-slate-500 text-sm">
                <MapPin className="w-4 h-4" />{agency.city}, {agency.state}
              </p>
            </div>
            <Link href={`/forum/new?agency=${slug}`} className="btn-primary shrink-0 self-start">
              Start a Discussion
            </Link>
          </div>
        </div>
      </div>

      <div className="page-container py-10 max-w-4xl">
        {/* Tab nav */}
        <div className="flex gap-1 border-b border-slate-200 mb-6">
          {[
            { label: "Reviews", href: `/agencies/${slug}` },
            { label: "Forum", href: `/agencies/${slug}/forum`, active: true },
            { label: "Jobs", href: `/agencies/${slug}/jobs` },
          ].map((tab) => (
            <Link key={tab.label} href={tab.href}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
                tab.active ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}>
              {tab.label}
            </Link>
          ))}
        </div>

        {threads.length === 0 ? (
          <div className="card p-12 text-center">
            <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-700 mb-1">No discussions about {agency.name} yet</p>
            <p className="text-sm text-slate-400 mb-4">
              Start the first anonymous conversation about this agency.
            </p>
            <Link href={`/forum/new?agency=${slug}`} className="btn-primary">
              Start a Discussion
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/forum/${thread.id}`}
                className="card p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-sm transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {thread.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate text-sm">
                      {thread.title}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {thread.anonymous_alias} · {timeAgo(thread.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" />{thread.upvotes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />{thread.comment_count}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-red-300 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Link to global forum */}
        <div className="mt-8 text-center">
          <Link href="/forum" className="text-sm text-slate-500 hover:text-red-600 font-medium transition-colors">
            Browse the nationwide forum →
          </Link>
        </div>
      </div>
    </>
  );
}
