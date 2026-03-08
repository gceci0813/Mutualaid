import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function deriveCredentials(phrase: string): { email: string; password: string } {
  const encoded = Buffer.from(phrase.trim().toLowerCase())
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20);
  const password = Buffer.from(`mutualaid::seed::${phrase.trim()}`)
    .toString("base64url")
    .slice(0, 48);
  return { email: `anon-${encoded}@mutualaid.anon`, password };
}

export async function POST(req: NextRequest) {
  const { phrase, action, alias } = await req.json();

  if (!phrase || typeof phrase !== "string" || phrase.trim().split(/\s+/).length < 12) {
    return NextResponse.json({ error: "A 12-word seed phrase is required." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ unconfigured: true }, { status: 200 });
  }

  const { email, password } = deriveCredentials(phrase);

  if (action === "check") {
    // Check if an account already exists for this phrase
    const { data: { users } } = await admin.auth.admin.listUsers();
    const exists = users.some((u) => u.email === email);
    return NextResponse.json({ exists });
  }

  // action === "signup"
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      anonymous_alias: alias ?? `User${Math.floor(Math.random() * 9000) + 1000}`,
      signup_method: "seed_phrase",
      anonymous: true,
    },
  });

  if (error) {
    // If user already exists, that's fine — they can sign in
    if (error.message?.includes("already been registered") || error.message?.includes("already exists")) {
      return NextResponse.json({ ok: true, existing: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: data.user?.id });
}
