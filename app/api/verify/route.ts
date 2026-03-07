import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if already verified
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_verified_officer, verified_agency_id")
    .eq("id", user.id)
    .single();

  if (profile?.is_verified_officer) {
    return NextResponse.json(
      { error: "You are already a verified officer." },
      { status: 400 }
    );
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  // Use service-role client to read codes (bypasses RLS)
  const admin = createAdminClient();

  const { data: accessCode, error: codeError } = await admin
    .from("agency_access_codes")
    .select("id, agency_id, used_by_user_id, agencies(name)")
    .eq("code", normalizedCode)
    .single();

  if (codeError || !accessCode) {
    return NextResponse.json({ error: "Invalid code. Please check and try again." }, { status: 400 });
  }

  if (accessCode.used_by_user_id) {
    return NextResponse.json({ error: "This code has already been used." }, { status: 400 });
  }

  // Mark code as used
  const { error: useError } = await admin
    .from("agency_access_codes")
    .update({ used_by_user_id: user.id, used_at: new Date().toISOString() })
    .eq("id", accessCode.id);

  if (useError) {
    return NextResponse.json({ error: "Failed to redeem code. Please try again." }, { status: 500 });
  }

  // Update user profile — own profile update allowed by RLS
  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      is_verified_officer: true,
      verified_agency_id: accessCode.agency_id,
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: "Failed to update profile. Please contact support." }, { status: 500 });
  }

  const agencyName = (accessCode.agencies as unknown as { name: string } | null)?.name ?? "your agency";

  return NextResponse.json({ success: true, agencyName });
}
