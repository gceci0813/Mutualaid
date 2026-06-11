import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body } = (await req.json()) as { body?: string };
  if (!body || body.trim().length < 10) {
    return NextResponse.json({ error: "Response must be at least 10 characters." }, { status: 400 });
  }
  if (body.length > 3000) {
    return NextResponse.json({ error: "Response is too long (max 3000 characters)." }, { status: 400 });
  }

  const admin = createAdminClient();

  // The review must exist
  const { data: review } = await admin
    .from("reviews")
    .select("id, agency_id")
    .eq("id", reviewId)
    .single();
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  // Caller must hold an ACTIVE claim on this review's agency
  const { data: claim } = await admin
    .from("agency_claims")
    .select("id")
    .eq("agency_id", review.agency_id)
    .eq("claimed_by", user.id)
    .eq("active", true)
    .single();
  if (!claim) {
    return NextResponse.json(
      { error: "Only the verified agency account can respond to reviews." },
      { status: 403 }
    );
  }

  // One response per review (unique constraint) — upsert lets agencies edit
  const { data: response, error } = await admin
    .from("review_responses")
    .upsert(
      { review_id: reviewId, agency_id: review.agency_id, body: body.trim() },
      { onConflict: "review_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to save response." }, { status: 500 });
  return NextResponse.json({ response });
}
