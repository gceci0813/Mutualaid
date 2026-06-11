import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CONTENT_TYPES = ["review", "thread", "comment"] as const;
const REASONS = ["doxxing", "harassment", "spam", "false_info", "inappropriate", "other"] as const;

const CONTENT_TABLES: Record<string, string> = {
  review: "reviews",
  thread: "threads",
  comment: "comments",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "You must be signed in to report content." }, { status: 401 });

  const { contentType, contentId, reason, details } = (await req.json()) as {
    contentType?: string; contentId?: string; reason?: string; details?: string;
  };

  if (!contentType || !CONTENT_TYPES.includes(contentType as typeof CONTENT_TYPES[number])) {
    return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
  }
  if (!contentId) {
    return NextResponse.json({ error: "contentId is required." }, { status: 400 });
  }
  if (!reason || !REASONS.includes(reason as typeof REASONS[number])) {
    return NextResponse.json({ error: "Invalid reason." }, { status: 400 });
  }
  if (details && details.length > 1000) {
    return NextResponse.json({ error: "Details too long (max 1000 characters)." }, { status: 400 });
  }

  const admin = createAdminClient();

  // The reported content must exist
  const { data: content } = await admin
    .from(CONTENT_TABLES[contentType])
    .select("id")
    .eq("id", contentId)
    .single();
  if (!content) return NextResponse.json({ error: "Content not found." }, { status: 404 });

  const { error } = await admin.from("content_reports").insert({
    content_type: contentType,
    content_id: contentId,
    reported_by: user.id,
    reason,
    details: details?.trim() || null,
  });

  if (error) {
    // unique violation = duplicate report from same user
    if (error.code === "23505") {
      return NextResponse.json({ error: "You've already reported this content." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
