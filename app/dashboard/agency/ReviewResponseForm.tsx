"use client";

import { useState } from "react";
import { MessageSquare, CheckCircle, AlertCircle, Pencil } from "lucide-react";

export default function ReviewResponseForm({
  reviewId,
  existingResponse,
}: {
  reviewId: string;
  existingResponse: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(existingResponse ?? "");
  const [saved, setSaved] = useState(existingResponse);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 10) {
      setError("Response must be at least 10 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reviews/${reviewId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save response.");
        setLoading(false);
        return;
      }
      setSaved(body.trim());
      setOpen(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-2">
        {saved && (
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 mb-2">
            <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />Your official response
              {justSaved && (
                <span className="text-emerald-600 flex items-center gap-0.5 ml-1">
                  <CheckCircle className="w-3 h-3" />Saved
                </span>
              )}
            </p>
            <p className="text-xs text-slate-600 line-clamp-2">{saved}</p>
          </div>
        )}
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
        >
          {saved ? (<><Pencil className="w-3 h-3" />Edit response</>) : (<><MessageSquare className="w-3 h-3" />Respond publicly</>)}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <textarea
        className="input min-h-[70px] resize-none text-sm w-full"
        placeholder="Write your official response — it will appear publicly under this review…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={3000}
      />
      {error && (
        <p className="flex items-center gap-1.5 text-red-600 text-xs">
          <AlertCircle className="w-3.5 h-3.5" />{error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button type="submit" className="btn-primary text-xs py-1.5 px-3" disabled={loading || body.trim().length < 10}>
          {loading ? "Saving…" : "Post Response"}
        </button>
        <button
          type="button"
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => { setOpen(false); setError(""); }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
