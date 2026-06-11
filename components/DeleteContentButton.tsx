"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const TABLES = { review: "reviews", thread: "threads" } as const;

export default function DeleteContentButton({
  contentType,
  contentId,
}: {
  contentType: keyof typeof TABLES;
  contentId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Permanently delete this ${contentType}? This cannot be undone.`)) return;
    setDeleting(true);
    const supabase = createClient();
    // RLS "own_delete" policy ensures users can only delete their own rows
    const { error } = await supabase.from(TABLES[contentType]).delete().eq("id", contentId);
    setDeleting(false);
    if (!error) router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
      aria-label={`Delete ${contentType}`}
      title={`Delete ${contentType}`}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
