import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_verified_officer, verified_agency_id, agencies(name)")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    isVerified: profile?.is_verified_officer ?? false,
    agencyName: (profile?.agencies as unknown as { name: string } | null)?.name ?? null,
  });
}
