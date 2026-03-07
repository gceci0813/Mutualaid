import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAdmin(email: string | undefined): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return !!email && adminEmails.includes(email.toLowerCase());
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code; // e.g. "ABCD-EFGH-JKLM"
}

// GET /api/admin/codes?agencyId=xxx — list codes for an agency
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const agencyId = req.nextUrl.searchParams.get("agencyId");
  if (!agencyId) {
    return NextResponse.json({ error: "agencyId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("agency_access_codes")
    .select("id, code, used_by_user_id, used_at, created_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load codes" }, { status: 500 });
  }

  return NextResponse.json({ codes: data });
}

// POST /api/admin/codes — generate N codes for an agency
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { agencyId, count } = await req.json();
  if (!agencyId || typeof agencyId !== "string") {
    return NextResponse.json({ error: "agencyId is required" }, { status: 400 });
  }

  const n = Math.min(Math.max(1, Number(count) || 1), 100);

  const admin = createAdminClient();

  // Verify agency exists
  const { data: agency } = await admin
    .from("agencies")
    .select("id, name")
    .eq("id", agencyId)
    .single();

  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  // Generate unique codes (retry on collision)
  const rows = [];
  const seen = new Set<string>();
  while (rows.length < n) {
    const code = generateCode();
    if (!seen.has(code)) {
      seen.add(code);
      rows.push({ agency_id: agencyId, code });
    }
  }

  const { data: inserted, error } = await admin
    .from("agency_access_codes")
    .insert(rows)
    .select("code");

  if (error) {
    // Handle unique constraint violations by regenerating
    return NextResponse.json({ error: "Code generation failed. Try again." }, { status: 500 });
  }

  return NextResponse.json({
    codes: inserted.map((r: { code: string }) => r.code),
    agencyName: agency.name,
  });
}
