"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Shield, Flag, Trash2, X, RefreshCw, CheckCircle, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  content_type: "review" | "thread" | "comment";
  content_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  content: {
    id: string;
    title?: string;
    body: string;
    anonymous_alias: string;
  } | null;
}

const REASON_LABELS: Record<string, string> = {
  doxxing: "Doxxing",
  harassment: "Harassment",
  spam: "Spam",
  false_info: "False info",
  inappropriate: "Inappropriate",
  other: "Other",
};

const REASON_COLORS: Record<string, string> = {
  doxxing: "bg-red-100 text-red-700",
  harassment: "bg-orange-100 text-orange-700",
  spam: "bg-amber-100 text-amber-700",
  false_info: "bg-blue-100 text-blue-700",
  inappropriate: "bg-purple-100 text-purple-700",
  other: "bg-slate-100 text-slate-600",
};

export default function AdminReportsPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"pending" | "resolved" | "dismissed">("pending");
  const [acting, setActing] = useState<string | null>(null);

  const loadReports = useCallback(async (status: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/reports?status=${status}`);
    if (res.status === 403) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReports(statusFilter);
  }, [statusFilter, loadReports]);

  async function handleAction(reportId: string, action: "dismiss" | "remove_content") {
    if (action === "remove_content" && !window.confirm("Permanently delete this content? This cannot be undone.")) {
      return;
    }
    setActing(reportId);
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action }),
    });
    setActing(null);
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  }

  if (authorized === null && !loading) {
    return (
      <div className="page-container py-10 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="page-container py-10 max-w-lg text-center">
        <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 text-sm">This page is for administrators only.</p>
      </div>
    );
  }

  return (
    <div className="page-container py-10 max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Content Reports</h1>
            <p className="text-sm text-slate-500">Review flagged content and take action</p>
          </div>
        </div>
        <Link href="/dashboard/admin" className="btn-secondary text-xs gap-1.5">
          <KeyRound className="w-3.5 h-3.5" />Verification Codes
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-6">
        {(["pending", "resolved", "dismissed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize",
              statusFilter === s ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => loadReports(statusFilter)}
          className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
        >
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium mb-1">No {statusFilter} reports</p>
          {statusFilter === "pending" && (
            <p className="text-slate-400 text-sm">The moderation queue is clear. 🎉</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="card p-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={cn("badge text-xs", REASON_COLORS[report.reason])}>
                  {REASON_LABELS[report.reason] ?? report.reason}
                </span>
                <span className="badge bg-slate-100 text-slate-500 text-xs capitalize">{report.content_type}</span>
                <span className="text-xs text-slate-400 ml-auto">
                  {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>

              {report.details && (
                <p className="text-xs text-slate-500 italic mb-3">Reporter note: &ldquo;{report.details}&rdquo;</p>
              )}

              {/* Reported content preview */}
              {report.content ? (
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  {report.content.title && (
                    <p className="text-sm font-bold text-slate-800 mb-1">{report.content.title}</p>
                  )}
                  <p className="text-sm text-slate-600 line-clamp-4 whitespace-pre-wrap">{report.content.body}</p>
                  <p className="text-xs text-slate-400 mt-2">by {report.content.anonymous_alias}</p>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 mb-4 text-sm text-slate-400">
                  Content no longer exists (already removed).
                </div>
              )}

              {report.status === "pending" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(report.id, "remove_content")}
                    disabled={acting === report.id || !report.content}
                    className="btn-primary text-xs gap-1.5 py-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />Remove Content
                  </button>
                  <button
                    onClick={() => handleAction(report.id, "dismiss")}
                    disabled={acting === report.id}
                    className="btn-secondary text-xs gap-1.5 py-2"
                  >
                    <X className="w-3.5 h-3.5" />Dismiss Report
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
