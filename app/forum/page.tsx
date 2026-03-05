"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare, ThumbsUp, Pin, Plus, Filter, Search,
  Flame, Clock, TrendingUp
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, DISCIPLINE_LABELS } from "@/lib/utils";
import type { Thread, ThreadCategory, DisciplineType } from "@/types";

const CATEGORIES: { value: ThreadCategory | ""; label: string; emoji: string }[] = [
  { value: "", label: "All Topics", emoji: "💬" },
  { value: "general", label: "General", emoji: "💬" },
  { value: "salary", label: "Salary & Pay", emoji: "💰" },
  { value: "culture", label: "Work Culture", emoji: "🏛️" },
  { value: "equipment", label: "Equipment & Gear", emoji: "🛡️" },
  { value: "training", label: "Training", emoji: "📋" },
  { value: "mental_health", label: "Mental Health", emoji: "🧠" },
  { value: "family_life", label: "Family Life", emoji: "🏠" },
  { value: "news", label: "News & Updates", emoji: "📰" },
  { value: "advice", label: "Career Advice", emoji: "🎯" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent", icon: Clock },
  { value: "top", label: "Top Rated", icon: TrendingUp },
  { value: "hot", label: "Hot", icon: Flame },
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
    else if (sort === "hot")
      q = q.order("comment_count", { ascending: false });

    const { data } = await q;
    setThreads((data as Thread[]) ?? []);
    setLoading(false);
  }

  return (
    <div className="page-container py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Community Forum</h1>
          <p className="text-slate-500">
            Anonymous discussions for first responders — salary, mental health, culture, and more.
          </p>
        </div>
        <Link href="/forum/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Thread
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar categories */}
        <div className="lg:col-span-1">
          <div className="card p-4 sticky top-20">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide">
              Topics
            </h3>
            <nav className="space-y-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value as ThreadCategory | "")}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    category === cat.value
                      ? "bg-red-50 text-red-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Thread list */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search + sort bar */}
          <div className="card p-3 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="input pl-9"
                placeholder="Search threads..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    sort === opt.value
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-slate-600">No threads yet</p>
              <p className="text-sm mt-1">Start the conversation</p>
              <Link href="/forum/new" className="btn-primary mt-4">
                Create First Thread
              </Link>
            </div>
          ) : (
            threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ThreadCard({ thread }: { thread: Thread }) {
  const cat = CATEGORIES.find((c) => c.value === thread.category);

  return (
    <Link
      href={`/forum/${thread.id}`}
      className="card p-5 block hover:border-red-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {thread.pinned && (
              <span className="badge bg-amber-50 text-amber-700">
                <Pin className="w-3 h-3 mr-1" /> Pinned
              </span>
            )}
            {cat && (
              <span className="badge bg-slate-100 text-slate-600">
                {cat.emoji} {cat.label}
              </span>
            )}
            {thread.discipline_filter && (
              <span className="badge bg-blue-50 text-blue-700">
                {DISCIPLINE_LABELS[thread.discipline_filter as DisciplineType]}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-slate-900 group-hover:text-red-600 transition-colors leading-snug mb-1.5 truncate">
            {thread.title}
          </h3>

          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {thread.body}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
        <span className="font-medium text-slate-600">{thread.anonymous_alias}</span>
        <span>{timeAgo(thread.created_at)}</span>
        <span className="flex items-center gap-1">
          <ThumbsUp className="w-3 h-3" />
          {thread.upvotes}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {thread.comment_count} comment{thread.comment_count !== 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}
