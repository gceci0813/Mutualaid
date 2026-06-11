"use client";

import { useState, useRef, useEffect } from "react";
import { Flag, CheckCircle, AlertCircle, X } from "lucide-react";

const REASONS = [
  { value: "doxxing", label: "Doxxing / exposes someone's identity" },
  { value: "harassment", label: "Harassment or threats" },
  { value: "spam", label: "Spam or advertising" },
  { value: "false_info", label: "False information" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

export default function ReportButton({
  contentType,
  contentId,
  className = "",
}: {
  contentType: "review" | "thread" | "comment";
  contentId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setState("submitting");
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, contentId, reason, details }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit report.");
        setState("idle");
        return;
      }
      setState("done");
      setTimeout(() => { setOpen(false); setState("idle"); setReason(""); setDetails(""); }, 2000);
    } catch {
      setError("Network error — please try again.");
      setState("idle");
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-slate-300 hover:text-red-500 transition-colors"
        aria-label="Report this content"
        title="Report"
      >
        <Flag className="w-3 h-3" />
        Report
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-30"
        >
          {state === "done" ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm py-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Report submitted. Our team will review it.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-800">Report this {contentType}</p>
                <button type="button" onClick={() => setOpen(false)} className="text-slate-300 hover:text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5 mb-3">
                {REASONS.map((r) => (
                  <label key={r.value} className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name={`reason-${contentId}`}
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="mt-0.5 accent-red-600"
                    />
                    <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{r.label}</span>
                  </label>
                ))}
              </div>
              {reason === "other" && (
                <textarea
                  className="input text-xs min-h-[50px] resize-none w-full mb-2"
                  placeholder="Tell us more (optional)…"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={1000}
                />
              )}
              {error && (
                <p className="flex items-center gap-1.5 text-red-600 text-xs mb-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
                </p>
              )}
              <button
                type="submit"
                className="btn-primary text-xs w-full justify-center py-2"
                disabled={!reason || state === "submitting"}
              >
                {state === "submitting" ? "Submitting…" : "Submit Report"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
