import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use RPC to safely increment — avoids race conditions
  const { data, error } = await supabase.rpc("increment_comment_upvotes", { comment_id: id });

  if (error) {
    // Fallback: manual increment if RPC doesn't exist
    const { data: comment } = await supabase
      .from("comments")
      .select("upvotes")
      .eq("id", id)
      .single();

    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    const { data: updated, error: updateError } = await supabase
      .from("comments")
      .update({ upvotes: (comment.upvotes ?? 0) + 1 })
      .eq("id", id)
      .select("upvotes")
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ upvotes: updated.upvotes });
  }

  return NextResponse.json({ upvotes: data });
}
