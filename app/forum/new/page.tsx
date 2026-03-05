"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ThreadCategory, DisciplineType } from "@/types";

const CATEGORIES = [
  { value: "general",       label: "General",         emoji: "💬" },
  { value: "salary",        label: "Salary & Pay",    emoji: "💰" },
  { value: "culture",       label: "Work Culture",    emoji: "🏛️" },
  { value: "equipment",     label: "Equipment",       emoji: "🛡️" },
  { value: "training",      label: "Training",        emoji: "📋" },
  { value: "mental_health", label: "Mental Health",   emoji: "🧠" },
  { value: "family_life",   label: "Family Life",     emoji: "🏠" },
  { value: "news",          label: "News",            emoji: "📰" },
  { value: "advice",        label: "Career Advice",   emoji: "🎯" },
];

const DISCIPLINES = [
  { value: "", label: "All Disciplines" },
  { value: "police", label: "Law Enforcement" },
  { value: "fire", label: "Fire" },
  { value: "ems", label: "EMS" },
  { value: "dispatch", label: "Dispatch" },
  { value: "dpw", label: "Public Works" },
  { value: "fbi", label: "FBI" },
  { value: "dhs", label: "DHS" },
  { value: "corrections", label: "Corrections" },
];

export default function NewThreadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<ThreadCategory>("general");
  const [discipline, setDiscipline] = useState<DisciplineType | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/forum/new");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("threads")
      .insert({
        user_id: user.id,
        anonymous_alias: user.user_metadata?.anonymous_alias ?? "Anonymous",
        title: title.trim(),
        body: body.trim(),
        category,
        discipline_filter: discipline || null,
        upvotes: 0,
        comment_count: 0,
        pinned: false,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/forum/${data.id}`);
  }

  return (
    <div className="page-container py-10 max-w-2xl">
      <Link
        href="/forum"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to forum
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">New Thread</h1>
      <p className="text-slate-500 text-sm mb-8">
        Posted anonymously under your alias.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div className="card p-5">
          <label className="label">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value as ThreadCategory)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                  category === cat.value
                    ? "bg-red-50 border-red-500 text-red-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Discipline filter */}
        <div className="card p-5">
          <label className="label">Discipline (optional)</label>
          <p className="text-xs text-slate-400 mb-3">
            Tag this thread for a specific first responder discipline.
          </p>
          <select
            className="input"
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value as DisciplineType | "")}
          >
            {DISCIPLINES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="card p-5 space-y-4">
          <div>
            <label className="label" htmlFor="title">
              Thread title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="input"
              placeholder="What do you want to discuss?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={150}
            />
          </div>
          <div>
            <label className="label" htmlFor="body">
              Post body <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              className="input min-h-[160px] resize-y"
              placeholder="Share your thoughts, questions, or experience..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={20}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Posting anonymously under your alias</p>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Posting..." : "Post Thread"}
          </button>
        </div>
      </form>
    </div>
  );
}
