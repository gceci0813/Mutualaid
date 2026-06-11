"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowRight, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, US_STATES } from "@/lib/utils";
import type { DisciplineType } from "@/types";

const DISCIPLINE_OPTIONS: { value: DisciplineType; label: string; emoji: string }[] = [
  { value: "police", label: "Law Enforcement", emoji: "👮" },
  { value: "fire", label: "Fire", emoji: "🚒" },
  { value: "ems", label: "EMS / Ambulance", emoji: "🚑" },
  { value: "dispatch", label: "Dispatch / 911", emoji: "📡" },
  { value: "corrections", label: "Corrections", emoji: "🔒" },
  { value: "dpw", label: "Public Works", emoji: "🚧" },
  { value: "fbi", label: "Federal (FBI)", emoji: "🏛️" },
  { value: "other", label: "Other", emoji: "🛡️" },
];

export default function WelcomePage() {
  const router = useRouter();
  const [discipline, setDiscipline] = useState<DisciplineType | "">("");
  const [state, setState] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    setSaving(true);

    // Persist discipline on the profile so future features can personalize;
    // best-effort — onboarding proceeds either way.
    if (discipline) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_profiles").update({ discipline }).eq("id", user.id);
      }
    }

    const params = new URLSearchParams();
    if (discipline) params.set("discipline", discipline);
    if (state) params.set("state", state);
    router.push(`/agencies${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-200">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-semibold mb-3">
            <CheckCircle className="w-4 h-4" />Account created — you&apos;re anonymous
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
            Welcome to MutualAid
          </h1>
          <p className="text-slate-500">
            Two quick questions so we can show you the right agencies. Both optional.
          </p>
        </div>

        {/* Discipline picker */}
        <div className="card p-6 mb-4">
          <p className="font-bold text-slate-900 text-sm mb-3">What&apos;s your discipline?</p>
          <div className="grid grid-cols-2 gap-2">
            {DISCIPLINE_OPTIONS.map(({ value, label, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDiscipline(discipline === value ? "" : value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left",
                  discipline === value
                    ? "bg-red-50 border-red-500 text-red-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <span>{emoji}</span>
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* State picker */}
        <div className="card p-6 mb-6">
          <p className="font-bold text-slate-900 text-sm mb-3">Which state do you work in?</p>
          <select className="input" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Select a state (optional)</option>
            {US_STATES.map((s) => (
              <option key={s.abbr} value={s.abbr}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <button
          onClick={handleContinue}
          disabled={saving}
          className="btn-primary w-full justify-center text-base py-3"
        >
          {saving ? "One sec…" : "Find My Agency"}
          <ArrowRight className="w-4 h-4" />
        </button>
        <div className="text-center mt-4">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Skip for now → go to dashboard
          </Link>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed">
          Your discipline is stored on your anonymous profile — never your name, never your
          department, never anything identifying.
        </p>
      </div>
    </div>
  );
}
