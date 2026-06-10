import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash, randomInt } from "crypto";

const GOV_DOMAINS = [
  /\.gov$/i,
  /\.mil$/i,
  /\.us$/i,
  /\.state\.[a-z]{2}\.us$/i,
];

function isAllowedDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return GOV_DOMAINS.some((re) => re.test(domain));
}

function extractDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Email service not configured (RESEND_API_KEY missing)");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MutualAid <verify@mutualaid.app>",
      to,
      subject: "Your MutualAid verification code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#dc2626">Verify your officer status</h2>
          <p>Enter this code in MutualAid to verify your officer status. It expires in 15 minutes.</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0f172a;padding:20px;background:#f8fafc;border-radius:8px;text-align:center">
            ${otp}
          </div>
          <p style="color:#64748b;font-size:13px;margin-top:24px">
            After verification your work email is permanently deleted from our records.
            Only your verified domain (e.g. sfpd.gov) is retained — your identity stays anonymous.
          </p>
          <p style="color:#94a3b8;font-size:12px">If you didn't request this, ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Email send failed: ${body}`);
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await req.json();
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const trimmed = email.trim().toLowerCase();

  if (!isAllowedDomain(trimmed)) {
    return NextResponse.json(
      { error: "Only official government or public safety email domains are accepted (.gov, .mil, .us)." },
      { status: 400 }
    );
  }

  // Check if already verified
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_verified_officer")
    .eq("id", user.id)
    .single();

  if (profile?.is_verified_officer) {
    return NextResponse.json({ error: "You are already verified." }, { status: 400 });
  }

  const otp = String(randomInt(100000, 999999));
  const domain = extractDomain(trimmed);

  const admin = createAdminClient();

  // Upsert token — replaces any existing pending token for this user.
  // We store ONLY the domain and hashed OTP — never the email address.
  const { error: tokenError } = await admin
    .from("email_verification_tokens")
    .upsert(
      {
        user_id: user.id,
        domain,
        otp_hash: hashOtp(otp),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (tokenError) {
    return NextResponse.json({ error: "Failed to create verification token." }, { status: 500 });
  }

  try {
    await sendOtpEmail(trimmed, otp);
  } catch (err) {
    // Clean up token if email fails
    await admin.from("email_verification_tokens").delete().eq("user_id", user.id);
    const message = err instanceof Error ? err.message : "Failed to send email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Email address is now discarded — only domain + otp_hash are stored
  return NextResponse.json({ success: true, domain });
}
