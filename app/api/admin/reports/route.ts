import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAdmin(email: string | undefined): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return !!email && adminEmails.includes(email.toLowerCase());
}

const CONTENT_TABLES: Record<string, string> = {
  review: "reviews",
  thread: "threads",
  comment: "comments",
};

const CONTENT_PREVIEW_FIELDS: Record<string, string> = {
  review: "id, title, body, anonymous_alias, agency_id",
  thread: "id, title, body, anonymous_alias",
  comment: "id, body, anonymous_alias, thread_id",
};

// GET /api/admin/reports?status=pending — list reports with content previews
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const admin = createAdminClient();

  const { data: reports, error } = await admin
    .from("content_reports")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "Failed to load reports." }, { status: 500 });

  // Attach content previews
  const withContent = await Promise.all(
    (reports ?? []).map(async (report) => {
      const { data: content } = await admin
        .from(CONTENT_TABLES[report.content_type])
        .select(CONTENT_PREVIEW_FIELDS[report.content_type])
        .eq("id", report.content_id)
        .single();
      return { ...report, content };
    })
  );

  return NextResponse.json({ reports: withContent });
}

// PATCH /api/admin/reports — resolve a report
// { reportId, action: "dismiss" | "remove_content" }
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reportId, action } = (await req.json()) as { reportId?: string; action?: string };
  if (!reportId || !action || !["dismiss", "remove_content"].includes(action)) {
    return NextResponse.json({ error: "reportId and a valid action are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: report } = await admin
    .from("content_reports")
    .select("id, content_type, content_id")
    .eq("id", reportId)
    .single();
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

  if (action === "remove_content") {
    const { error: deleteError } = await admin
      .from(CONTENT_TABLES[report.content_type])
      .delete()
      .eq("id", report.content_id);
    if (deleteError) {
      return NextResponse.json({ error: "Failed to remove content." }, { status: 500 });
    }
  }

  const { error } = await admin
    .from("content_reports")
    .update({
      status: action === "dismiss" ? "dismissed" : "resolved",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) return NextResponse.json({ error: "Failed to update report." }, { status: 500 });

  // Resolve any other pending reports against the same (now removed) content
  if (action === "remove_content") {
    await admin
      .from("content_reports")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("content_type", report.content_type)
      .eq("content_id", report.content_id)
      .eq("status", "pending");
  }

  return NextResponse.json({ success: true });
}
