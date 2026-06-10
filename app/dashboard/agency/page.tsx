"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2, BarChart2, Star, Briefcase, MessageSquare,
  CheckCircle, Clock, ChevronRight, Shield
} from "lucide-react";
import { DISCIPLINE_LABELS } from "@/lib/utils";
import type { DisciplineType } from "@/types";

interface Claim {
  id: string;
  plan: string;
  active: boolean;
  created_at: string;
  contact_name: string;
  agencies: {
    id: string;
    name: string;
    city: string;
    state_abbr: string;
    discipline: DisciplineType;
    avg_overall: number | null;
    review_count: number | null;
    open_job_count: number | null;
  } | null;
}

export default function AgencyDashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agencies/claim")
      .then((r) => (r.ok ? r.json() : { claims: [] }))
      .then((data) => setClaims(data.claims ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="page-container py-16 max-w-xl">
        <div className="card p-8 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">No claimed agencies</h1>
          <p className="text-slate-500 text-sm mb-6">
            Claim your agency profile to respond to reviews, view analytics, and attract top candidates.
          </p>
          <Link href="/agencies" className="btn-primary justify-center">
            Find Your Agency
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-10 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agency Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your claimed agency profiles</p>
        </div>
        <Link href="/agencies" className="btn-secondary text-sm">
          Claim Another Agency
        </Link>
      </div>

      <div className="space-y-5">
        {claims.map((claim) => {
          const agency = claim.agencies;
          if (!agency) return null;

          return (
            <div key={claim.id} className="card p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">{agency.name}</h2>
                    <p className="text-xs text-slate-500">
                      {agency.city}, {agency.state_abbr} · {DISCIPLINE_LABELS[agency.discipline]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {claim.active ? (
                    <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending Review
                    </span>
                  )}
                  <span className={`badge ${claim.plan === "pro" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                    {claim.plan === "pro" ? "Pro" : "Basic"}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {agency.avg_overall ? agency.avg_overall.toFixed(1) : "—"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    Avg Rating
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{agency.review_count ?? 0}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Reviews
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{agency.open_job_count ?? 0}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    Open Jobs
                  </p>
                </div>
              </div>

              {claim.active ? (
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/agencies/${agency.id}`}
                    className="btn-primary text-sm gap-1.5"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    View Profile & Reviews
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link href="/jobs/post" className="btn-secondary text-sm gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Post a Job
                  </Link>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
                  <Shield className="w-3.5 h-3.5 inline mr-1" />
                  Your claim is under review. We&apos;ll contact <strong>{claim.contact_name}</strong> within 1–2 business days to verify and activate your account.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
