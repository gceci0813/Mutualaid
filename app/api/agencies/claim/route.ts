import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agencyId, plan, contactName, contactEmail } = await req.json();

  if (!agencyId || !plan || !contactName || !contactEmail) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!["basic", "pro"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check agency exists
  const { data: agency } = await admin
    .from("agencies")
    .select("id, name, is_claimed")
    .eq("id", agencyId)
    .single();

  if (!agency) return NextResponse.json({ error: "Agency not found." }, { status: 404 });
  if (agency.is_claimed) {
    return NextResponse.json(
      { error: "This agency has already been claimed. Contact support if you believe this is an error." },
      { status: 409 }
    );
  }

  // Check user hasn't already submitted a claim
  const { data: existing } = await admin
    .from("agency_claims")
    .select("id")
    .eq("claimed_by", user.id)
    .eq("agency_id", agencyId)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You already submitted a claim for this agency." }, { status: 409 });
  }

  const { error: claimError } = await admin.from("agency_claims").insert({
    agency_id: agencyId,
    claimed_by: user.id,
    plan,
    contact_name: contactName,
    contact_email: contactEmail,
    active: false, // pending admin approval
  });

  if (claimError) {
    return NextResponse.json({ error: "Failed to submit claim." }, { status: 500 });
  }

  return NextResponse.json({ success: true, agencyName: agency.name });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: claims } = await supabase
    .from("agency_claims")
    .select("id, plan, active, created_at, contact_name, agencies(id, name, city, state_abbr, discipline, avg_overall, review_count, open_job_count)")
    .eq("claimed_by", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ claims: claims ?? [] });
}
