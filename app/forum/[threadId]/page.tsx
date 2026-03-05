import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ThumbsUp, MessageSquare, Pin } from "lucide-react";
import CommentSection from "./CommentSection";
import type { Thread, Comment } from "@/types";

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

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("threads")
    .select("*")
    .eq("id", threadId)
    .single();

  if (!thread) notFound();

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const t = thread as Thread;
  const c = (comments as Comment[]) ?? [];

  return (
    <div className="page-container py-10 max-w-3xl">
      <Link
        href="/forum"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to forum
      </Link>

      {/* Thread */}
      <div className="card p-6 mb-6">
        {t.pinned && (
          <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium mb-3">
            <Pin className="w-4 h-4" />
            Pinned thread
          </div>
        )}

        <h1 className="text-2xl font-bold text-slate-900 mb-3">{t.title}</h1>

        <div className="flex items-center gap-3 text-sm text-slate-500 mb-4 flex-wrap">
          <span className="font-medium text-slate-700">{t.anonymous_alias}</span>
          <span>·</span>
          <span>{timeAgo(t.created_at)}</span>
        </div>

        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{t.body}</p>

        <div className="flex items-center gap-4 mt-5 pt-5 border-t border-slate-100 text-sm text-slate-500">
          <button className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
            <ThumbsUp className="w-4 h-4" />
            {t.upvotes} upvote{t.upvotes !== 1 ? "s" : ""}
          </button>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            {t.comment_count} comment{t.comment_count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <CommentSection threadId={threadId} initialComments={c} />
    </div>
  );
}
