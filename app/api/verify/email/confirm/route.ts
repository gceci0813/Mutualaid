import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { otp } = await req.json();
  if (!otp || typeof otp !== "string") {
    return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: token } = await admin
    .from("email_verification_tokens")
    .select("id, domain, otp_hash, expires_at")
    .eq("user_id", user.id)
    .single();

  if (!token) {
    return NextResponse.json(
      { error: "No pending verification found. Please request a new code." },
      { status: 400 }
    );
  }

  if (new Date(token.expires_at) < new Date()) {
    await admin.from("email_verification_tokens").delete().eq("user_id", user.id);
    return NextResponse.json(
      { error: "Verification code has expired. Please request a new one." },
      { status: 400 }
    );
  }

  if (hashOtp(otp.trim()) !== token.otp_hash) {
    return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
  }

  // Code is correct — mark user verified and permanently delete the token.
  // The domain (e.g. "sfpd.gov") is all we retain; the work email is gone.
  const [profileResult] = await Promise.all([
    supabase
      .from("user_profiles")
      .update({
        is_verified_officer: true,
        verified_domain: token.domain,
      })
      .eq("id", user.id),
    admin.from("email_verification_tokens").delete().eq("user_id", user.id),
  ]);

  if (profileResult.error) {
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }

  return NextResponse.json({ success: true, domain: token.domain });
}
