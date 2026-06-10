"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare, ThumbsUp, Pin, Plus, Search,
  Flame, Clock, TrendingUp
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, DISCIPLINE_LABELS } from "@/lib/utils";
import type { Thread, ThreadCategory, DisciplineType } from "@/types";

const CATEGORIES: { value: ThreadCategory | ""; label: string; emoji: string; color: string }[] = [
  { value: "",              label: "All Topics",    emoji: "💬", color: "bg-slate-100 text-slate-600" },
  { value: "general",       label: "General",       emoji: "💬", color: "bg-slate-100 text-slate-700" },
  { value: "salary",        label: "Salary & Pay",  emoji: "💰", color: "bg-emerald-100 text-emerald-700" },
  { value: "culture",       label: "Work Culture",  emoji: "🏛️", color: "bg-blue-100 text-blue-700" },
  { value: "equipment",     label: "Equipment",     emoji: "🛡️", color: "bg-orange-100 text-orange-700" },
  { value: "training",      label: "Training",      emoji: "📋", color: "bg-purple-100 text-purple-700" },
  { value: "mental_health", label: "Mental Health", emoji: "🧠", color: "bg-pink-100 text-pink-700" },
  { value: "family_life",   label: "Family Life",   emoji: "🏠", color: "bg-amber-100 text-amber-700" },
  { value: "news",          label: "News",          emoji: "📰", color: "bg-cyan-100 text-cyan-700" },
  { value: "advice",        label: "Career Advice", emoji: "🎯", color: "bg-red-100 text-red-700" },
];

const CATEGORY_BORDERS: Record<string, string> = {
  salary: "border-l-emerald-400", culture: "border-l-blue-400",
  equipment: "border-l-orange-400", training: "border-l-purple-400",
  mental_health: "border-l-pink-400", family_life: "border-l-amber-400",
  news: "border-l-cyan-400", advice: "border-l-red-500",
  general: "border-l-slate-300",
};

const SORT_OPTIONS = [
  { value: "recent", label: "Recent", icon: Clock },
  { value: "top",    label: "Top",    icon: TrendingUp },
  { value: "hot",    label: "Hot",    icon: Flame },
];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ThreadCard({ thread }: { thread: Thread }) {
  const cat = CATEGORIES.find((c) => c.value === thread.category);
  const borderColor = CATEGORY_BORDERS[thread.category] ?? "border-l-slate-200";
  return (
    <Link href={`/forum/${thread.id}`} className={cn("card block hover:shadow-md transition-all group border-l-4", borderColor)}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {thread.pinned && <span className="badge bg-amber-100 text-amber-700"><Pin className="w-3 h-3 mr-1" />Pinned</span>}
              {cat?.value && <span className={cn("badge", cat.color)}>{cat.emoji} {cat.label}</span>}
              {thread.discipline_filter && <span className="badge bg-blue-50 text-blue-700">{DISCIPLINE_LABELS[thread.discipline_filter as DisciplineType]}</span>}
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug mb-1.5">{thread.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{thread.body}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50 text-xs text-slate-400">
          <span className="font-semibold text-slate-600">{thread.anonymous_alias}</span>
          <span>{timeAgo(thread.created_at)}</span>
          <span className="flex items-center gap-1 ml-auto"><ThumbsUp className="w-3 h-3" />{thread.upvotes}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{thread.comment_count}</span>
        </div>
      </div>
    </Link>
  );
}

export default function ForumPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ThreadCategory | "">("");
  const [sort, setSort] = useState("recent");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(fetchThreads, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, query]);

  async function fetchThreads() {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("threads").select("*").limit(40);
    if (category) q = q.eq("category", category);
    if (query.trim()) q = q.ilike("title", `%${query.trim()}%`);
    if (sort === "recent") q = q.order("created_at", { ascending: false });
    else if (sort === "top") q = q.order("upvotes", { ascending: false });
    else q = q.order("comment_count", { ascending: false });
    const { data } = await q;
    setThreads((data as Thread[]) ?? []);
    setLoading(false);
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-bold uppercase tracking-widest">Community</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Community Forum</h1>
              <p className="text-slate-400 text-lg max-w-xl">Anonymous discussions on salary, mental health, culture, gear, and more.</p>
            </div>
            <Link href="/forum/new" className="btn-primary self-end shrink-0"><Plus className="w-4 h-4" />New Thread</Link>
          </div>
        </div>
      </div>

      <div className="page-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-20">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Topics</p>
              <nav className="space-y-0.5">
                {CATEGORIES.map((cat) => (
                  <button key={cat.value} onClick={() => setCategory(cat.value as ThreadCategory | "")}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors text-left",
                      category === cat.value ? "bg-slate-950 text-white font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
                    <span>{cat.emoji}</span>{cat.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="card p-3 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" className="input pl-9" placeholder="Search threads..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="flex gap-1 shrink-0">
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setSort(opt.value)}
                    className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors",
                      sort === opt.value ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100")}>
                    <opt.icon className="w-3.5 h-3.5" />{opt.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse border-l-4 border-l-slate-100 h-28" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="card p-16 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-slate-600 mb-1">No threads yet</p>
                <p className="text-sm mb-4">Start the conversation</p>
                <Link href="/forum/new" className="btn-primary">Create First Thread</Link>
              </div>
            ) : (
              threads.map((thread) => <ThreadCard key={thread.id} thread={thread} />)
            )}
          </div>
        </div>
      </div>
    </>
  );
}
