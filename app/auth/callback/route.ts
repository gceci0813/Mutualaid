import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function getSafeRedirect(next: string | null): string {
  if (!next) return "/dashboard";
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirect(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure user_profile exists — fallback in case the DB trigger failed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_profiles").upsert(
          {
            id: user.id,
            anonymous_alias:
              user.user_metadata?.anonymous_alias ??
              "User" + user.id.slice(0, 6),
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
