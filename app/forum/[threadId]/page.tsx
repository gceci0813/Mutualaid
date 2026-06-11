import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ThumbsUp, MessageSquare, Pin } from "lucide-react";
import CommentSection from "./CommentSection";
import ThreadUpvoteButton from "./ThreadUpvoteButton";
import type { Thread, Comment } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  general: "General", salary: "Salary & Pay", culture: "Work Culture",
  equipment: "Equipment", training: "Training", mental_health: "Mental Health",
  family_life: "Family Life", news: "News", advice: "Career Advice",
};

const CATEGORY_COLORS: Record<string, string> = {
  salary: "bg-emerald-100 text-emerald-700", culture: "bg-blue-100 text-blue-700",
  equipment: "bg-orange-100 text-orange-700", training: "bg-purple-100 text-purple-700",
  mental_health: "bg-pink-100 text-pink-700", family_life: "bg-amber-100 text-amber-700",
  news: "bg-cyan-100 text-cyan-700", advice: "bg-red-100 text-red-700",
  general: "bg-slate-100 text-slate-700",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const supabase = await createClient();

  const { data: thread } = await supabase.from("threads").select("*").eq("id", threadId).single();
  if (!thread) notFound();

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const t = thread as Thread;
  const c = (comments as Comment[]) ?? [];
  const catLabel = CATEGORY_LABELS[t.category] ?? "General";
  const catColor = CATEGORY_COLORS[t.category] ?? "bg-slate-100 text-slate-700";

  return (
    <>
      {/* Dark page header */}
      <div className="page-header">
        <div className="page-header-inner max-w-3xl">
          <Link href="/forum"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm font-medium mb-5 transition-colors">
            <ChevronLeft className="w-4 h-4" />Back to forum
          </Link>

          {t.pinned && (
            <div className="flex items-center gap-1.5 text-amber-600 text-sm font-semibold mb-3">
              <Pin className="w-4 h-4" />Pinned thread
            </div>
          )}

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`badge text-xs ${catColor}`}>{catLabel}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-4 tracking-tight">{t.title}</h1>

          <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
            <span className="font-semibold text-slate-700">{t.anonymous_alias}</span>
            <span className="text-slate-300">·</span>
            <span>{timeAgo(t.created_at)}</span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />{t.upvotes}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />{t.comment_count}
            </span>
          </div>
        </div>
      </div>

      <div className="page-container py-10 max-w-3xl">
        {/* Thread body */}
        <div className="card p-6 mb-6">
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">{t.body}</p>

          <div className="flex items-center gap-4 mt-5 pt-5 border-t border-slate-100 text-sm text-slate-500">
            <ThreadUpvoteButton threadId={t.id} initialUpvotes={t.upvotes} />
            <span className="flex items-center gap-1.5 text-slate-400">
              <MessageSquare className="w-4 h-4" />
              {t.comment_count} comment{t.comment_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <CommentSection threadId={threadId} initialComments={c} />
      </div>
    </>
  );
}
