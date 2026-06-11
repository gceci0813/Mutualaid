"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThreadUpvoteButton({
  threadId,
  initialUpvotes,
}: {
  threadId: string;
  initialUpvotes: number;
}) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [upvoted, setUpvoted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleUpvote() {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const newUpvoted = !upvoted;
    setUpvoted(newUpvoted);
    setUpvotes((prev) => prev + (newUpvoted ? 1 : -1));

    try {
      const res = await fetch(`/api/threads/${threadId}/upvote`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setUpvotes(data.upvotes);
      } else {
        // Revert
        setUpvoted(!newUpvoted);
        setUpvotes((prev) => prev + (newUpvoted ? -1 : 1));
      }
    } catch {
      // Revert
      setUpvoted(!newUpvoted);
      setUpvotes((prev) => prev + (newUpvoted ? -1 : 1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium text-sm",
        upvoted
          ? "bg-red-50 text-red-600 hover:bg-red-100"
          : "hover:text-slate-700 hover:bg-slate-100 text-slate-500"
      )}
    >
      <ThumbsUp className={cn("w-4 h-4", upvoted && "fill-red-500 text-red-500")} />
      {upvotes} upvote{upvotes !== 1 ? "s" : ""}
    </button>
  );
}
