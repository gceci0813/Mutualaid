"use client";

import { useState } from "react";
import { ThumbsUp, CornerDownRight, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Comment } from "@/types";

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

function CommentCard({
  comment,
  onReply,
  depth = 0,
}: {
  comment: Comment & { replies?: Comment[] };
  onReply: (parentId: string, alias: string) => void;
  depth?: number;
}) {
  return (
    <div className={cn("", depth > 0 && "ml-6 border-l-2 border-slate-100 pl-4")}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{comment.anonymous_alias}</span>
          <span>·</span>
          <span>{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{comment.body}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
          <button className="flex items-center gap-1 hover:text-slate-600 transition-colors">
            <ThumbsUp className="w-3 h-3" />
            {comment.upvotes}
          </button>
          <button
            className="flex items-center gap-1 hover:text-red-600 transition-colors"
            onClick={() => onReply(comment.id, comment.anonymous_alias)}
          >
            <CornerDownRight className="w-3 h-3" />
            Reply
          </button>
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentCard key={reply.id} comment={reply} onReply={onReply} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function CommentSection({
  threadId,
  initialComments,
}: {
  threadId: string;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; alias: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Build tree
  const topLevel = comments.filter((c) => !c.parent_id);
  const withReplies = topLevel.map((c) => ({
    ...c,
    replies: comments.filter((r) => r.parent_id === c.id),
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in to comment.");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({
        thread_id: threadId,
        user_id: user.id,
        anonymous_alias: user.user_metadata?.anonymous_alias ?? "Anonymous",
        body: body.trim(),
        parent_id: replyTo?.id ?? null,
        upvotes: 0,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setComments((prev) => [...prev, data as Comment]);
    setBody("");
    setReplyTo(null);
    setLoading(false);
  }

  return (
    <div>
      <h2 className="font-semibold text-slate-900 mb-4">
        {comments.length} Comment{comments.length !== 1 ? "s" : ""}
      </h2>

      {/* Comment form */}
      <div className="card p-5 mb-6">
        {replyTo && (
          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 mb-3 text-sm text-slate-600">
            <span>Replying to <strong>{replyTo.alias}</strong></span>
            <button
              className="text-slate-400 hover:text-slate-600 text-xs"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="Add a comment anonymously..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={loading || !body.trim()}>
              {loading ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      </div>

      {/* Comments */}
      {withReplies.length === 0 ? (
        <p className="text-center text-slate-400 py-8 text-sm">
          No comments yet. Be the first to respond.
        </p>
      ) : (
        <div className="card divide-y divide-slate-100 px-5">
          {withReplies.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              onReply={(id, alias) => setReplyTo({ id, alias })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
