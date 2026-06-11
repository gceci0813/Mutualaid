import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2, BarChart2, Star, Briefcase, MessageSquare,
  CheckCircle, Clock, ChevronRight, Shield, TrendingUp,
  Users, ThumbsUp
} from "lucide-react";
import { cn, DISCIPLINE_LABELS } from "@/lib/utils";
import CheckoutButton from "@/components/CheckoutButton";
import ReviewResponseForm from "./ReviewResponseForm";
import type { DisciplineType } from "@/types";

interface AgencyData {
  id: string;
  name: string;
  slug: string;
  city: string;
  state_abbr: string;
  discipline: DisciplineType;
  avg_overall: number | null;
  review_count: number | null;
  open_job_count: number | null;
  rating_culture: number | null;
  rating_leadership: number | null;
  rating_worklife: number | null;
  rating_pay: number | null;
  rating_equipment: number | null;
}

interface Claim {
  id: string;
  plan: string;
  active: boolean;
  created_at: string;
  contact_name: string;
  agencies: AgencyData | null;
}

const RATING_CATEGORIES = [
  { key: "rating_culture", label: "Work Culture" },
  { key: "rating_leadership", label: "Leadership" },
  { key: "rating_worklife", label: "Work/Life Balance" },
  { key: "rating_pay", label: "Pay & Benefits" },
  { key: "rating_equipment", label: "Equipment" },
] as const;

function RatingBar({ value, label }: { value: number | null; label: string }) {
  const pct = value ? (value / 5) * 100 : 0;
  const color = !value ? "bg-slate-200" : value >= 4 ? "bg-emerald-500" : value >= 3 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-6 text-right">{value ? value.toFixed(1) : "—"}</span>
    </div>
  );
}

export default async function AgencyDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch claims with full agency data
  const { data: rawClaims } = await supabase
    .from("agency_claims")
    .select("id, plan, active, created_at, contact_name, agencies(id, name, slug, city, state_abbr, discipline, avg_overall, review_count, open_job_count, rating_culture, rating_leadership, rating_worklife, rating_pay, rating_equipment)")
    .eq("claimed_by", user.id)
    .order("created_at", { ascending: false });

  const claims = (rawClaims ?? []) as unknown as Claim[];

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

  // Fetch recent reviews for all claimed agencies
  const agencyIds = claims.map(c => c.agencies?.id).filter(Boolean) as string[];
  const { data: rawReviews } = await supabase
    .from("reviews")
    .select("id, agency_id, rating_overall, title, body, created_at, anonymous_alias, review_responses(body)")
    .in("agency_id", agencyIds)
    .order("created_at", { ascending: false })
    .limit(10);
  const recentReviews = (rawReviews ?? []).map((r) => ({
    ...r,
    existing_response: (r.review_responses as { body: string }[] | null)?.[0]?.body ?? null,
  }));

  // Fetch discipline benchmarks for comparison
  const disciplines = [...new Set(claims.map(c => c.agencies?.discipline).filter(Boolean))] as DisciplineType[];
  const benchmarks: Record<string, number> = {};
  await Promise.all(
    disciplines.map(async (d) => {
      const { data } = await supabase
        .from("agencies")
        .select("avg_overall")
        .eq("discipline", d)
        .not("avg_overall", "is", null)
        .gte("review_count", 1);
      if (data && data.length > 0) {
        const avg = data.reduce((sum, a) => sum + (a.avg_overall ?? 0), 0) / data.length;
        benchmarks[d] = avg;
      }
    })
  );

  return (
    <div className="page-container py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agency Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your claimed agency profiles and track reviews</p>
        </div>
        <Link href="/agencies" className="btn-secondary text-sm">
          Claim Another Agency
        </Link>
      </div>

      <div className="space-y-6">
        {claims.map((claim) => {
          const agency = claim.agencies;
          if (!agency) return null;

          const agencyReviews = recentReviews.filter(r => r.agency_id === agency.id);
          const benchmark = benchmarks[agency.discipline];
          const diff = agency.avg_overall && benchmark ? agency.avg_overall - benchmark : null;

          return (
            <div key={claim.id} className="card p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
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
                      <CheckCircle className="w-3 h-3" />Active
                    </span>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />Pending Review
                    </span>
                  )}
                  <span className={cn("badge", claim.plan === "pro" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600")}>
                    {claim.plan === "pro" ? "Pro" : "Basic"}
                  </span>
                </div>
              </div>

              {claim.active ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-slate-900">
                        {agency.avg_overall ? agency.avg_overall.toFixed(1) : "—"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />Avg Rating
                      </p>
                      {diff !== null && (
                        <p className={cn("text-xs font-semibold mt-1", diff >= 0 ? "text-emerald-600" : "text-red-500")}>
                          {diff >= 0 ? "+" : ""}{diff.toFixed(1)} vs avg
                        </p>
                      )}
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-slate-900">{agency.review_count ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                        <MessageSquare className="w-3 h-3" />Reviews
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-slate-900">{agency.open_job_count ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                        <Briefcase className="w-3 h-3" />Open Jobs
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-slate-900">
                        {benchmark ? benchmark.toFixed(1) : "—"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3" />Discipline Avg
                      </p>
                    </div>
                  </div>

                  {/* Rating breakdown */}
                  {agency.avg_overall && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Rating Breakdown</p>
                      <div className="space-y-2.5">
                        {RATING_CATEGORIES.map(({ key, label }) => (
                          <RatingBar
                            key={key}
                            value={agency[key as keyof AgencyData] as number | null}
                            label={label}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent reviews */}
                  {agencyReviews.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Recent Reviews ({agencyReviews.length})
                      </p>
                      <div className="space-y-3">
                        {agencyReviews.slice(0, 3).map((review) => (
                          <div key={review.id} className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} className={cn("w-3 h-3", s <= review.rating_overall ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
                                ))}
                                <span className="text-xs font-bold text-slate-700 ml-1">{review.rating_overall}/5</span>
                              </div>
                              <span className="text-xs text-slate-400">
                                {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                            {review.title && (
                              <p className="text-sm font-semibold text-slate-800 mb-0.5">{review.title}</p>
                            )}
                            <p className="text-xs text-slate-500 line-clamp-2">{review.body}</p>
                            <p className="text-xs text-slate-400 mt-1.5">{review.anonymous_alias}</p>
                            <ReviewResponseForm
                              reviewId={review.id}
                              existingResponse={review.existing_response}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap pt-1 border-t border-slate-100">
                    <Link href={`/agencies/${agency.slug}`} className="btn-primary text-sm gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5" />
                      View Public Profile
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link href="/jobs/post" className="btn-secondary text-sm gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Post a Job
                    </Link>
                    <Link href={`/rankings/${agency.discipline}/${agency.state_abbr}`} className="btn-secondary text-sm gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      State Rankings
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
                    <Shield className="w-4 h-4 inline mr-1.5" />
                    Your claim is under review. We&apos;ll contact{" "}
                    <strong>{claim.contact_name}</strong> within 1–2 business days to verify and activate your account.
                  </div>
                  <div className="max-w-xs">
                    <CheckoutButton
                      plan={claim.plan === "pro" ? "pro" : "basic"}
                      claimId={claim.id}
                      className="btn-primary text-sm w-full justify-center"
                    >
                      Pay &amp; Activate {claim.plan === "pro" ? "Pro ($249/mo)" : "Basic ($99/mo)"}
                    </CheckoutButton>
                    <p className="text-xs text-slate-400 mt-1.5 text-center">
                      Skip the wait — activate instantly with payment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
