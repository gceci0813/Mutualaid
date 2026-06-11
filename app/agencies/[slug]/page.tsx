import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Star, Users, Briefcase, MessageSquare,
  ExternalLink, Shield, ChevronRight, ThumbsUp, Building2
} from "lucide-react";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS } from "@/lib/utils";
import type { Agency, Review } from "@/types";
import type { Metadata } from "next";

interface ReviewWithVerified extends Review {
  is_verified_officer: boolean;
  agency_response: { body: string; created_at: string } | null;
}

async function getAgency(slug: string): Promise<Agency | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("agencies").select("*").eq("slug", slug).single();
  return data as Agency | null;
}

async function getReviews(agencyId: string): Promise<ReviewWithVerified[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, user_profiles(is_verified_officer), review_responses(body, created_at)")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (!data) return [];
  return data.map((r) => {
    const responses = r.review_responses as { body: string; created_at: string }[] | null;
    return {
      ...r,
      is_verified_officer:
        (r.user_profiles as { is_verified_officer: boolean } | null)?.is_verified_officer ?? false,
      agency_response: responses?.[0] ?? null,
    };
  });
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-7 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn(sz, s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
      ))}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgency(slug);
  if (!agency) return {};
  const title = `${agency.name} Reviews, Salary & Jobs`;
  const description = `Anonymous reviews, salary data, and open positions at ${agency.name} in ${agency.city}, ${agency.state}. Written by verified ${DISCIPLINE_LABELS[agency.discipline].toLowerCase()} officers.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function AgencyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const [agency, reviews] = await Promise.all([
    getAgency(slug),
    getAgency(slug).then((a) => (a ? getReviews(a.id) : [])),
  ]);

  if (!agency) notFound();

  // Similar agencies: same discipline + state, exclude this one
  const { data: similarData } = await supabase
    .from("agencies")
    .select("id, name, slug, city, avg_overall, review_count")
    .eq("discipline", agency.discipline)
    .eq("state_abbr", agency.state_abbr)
    .neq("slug", slug)
    .not("avg_overall", "is", null)
    .order("avg_overall", { ascending: false })
    .limit(4);
  const similarAgencies = (similarData ?? []) as { id: string; name: string; slug: string; city: string; avg_overall: number; review_count: number }[];

  const ratings = reviews.length
    ? {
        overall:     avg(reviews, "rating_overall"),
        culture:     avg(reviews, "rating_culture"),
        leadership:  avg(reviews, "rating_leadership"),
        worklife:    avg(reviews, "rating_worklife"),
        pay:         avg(reviews, "rating_pay"),
        equipment:   avg(reviews, "rating_equipment"),
        advancement: avg(reviews, "rating_advancement"),
        family:      avg(reviews, "rating_family"),
      }
    : null;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: agency.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: agency.city,
      addressRegion: agency.state_abbr,
      addressCountry: "US",
    },
    ...(agency.website && { url: agency.website }),
    ...(ratings && reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: ratings.overall.toFixed(1),
        reviewCount: reviews.length,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Light page header */}
      <div className="page-header">
        <div className="page-header-inner">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm mb-5">
            <Link href="/agencies" className="text-slate-400 hover:text-slate-600 transition-colors">Agencies</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-700 font-medium">{agency.name}</span>
          </nav>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={cn("badge", DISCIPLINE_COLORS[agency.discipline])}>
                  {DISCIPLINE_LABELS[agency.discipline]}
                </span>
                {agency.verified && (
                  <span className="badge bg-blue-50 text-blue-700 border border-blue-100">
                    <Shield className="w-3 h-3 mr-1" />Verified
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">{agency.name}</h1>
              <p className="flex items-center gap-1.5 text-slate-500 text-sm">
                <MapPin className="w-4 h-4" />
                {agency.city}, {agency.state}
                {agency.county ? `, ${agency.county} County` : ""}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0 flex-wrap">
              {ratings && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                  <div className="text-4xl font-black text-slate-900 mb-1">{ratings.overall.toFixed(1)}</div>
                  <StarDisplay rating={ratings.overall} size="lg" />
                  <div className="text-xs text-slate-400 mt-1.5">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</div>
                </div>
              )}
              <Link href={`/agencies/${slug}/reviews/new`} className="btn-primary shrink-0 self-start">
                Write a Review
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ratings breakdown */}
            {ratings && (
              <div className="card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Rating Breakdown</p>
                <div className="space-y-3">
                  <RatingBar label="Work Culture"   value={ratings.culture} />
                  <RatingBar label="Leadership"      value={ratings.leadership} />
                  <RatingBar label="Work-Life"       value={ratings.worklife} />
                  <RatingBar label="Pay & Benefits"  value={ratings.pay} />
                  <RatingBar label="Equipment"       value={ratings.equipment} />
                </div>
              </div>
            )}

            {/* Tab nav */}
            <div className="flex gap-1 border-b border-slate-200">
              {[
                { label: "Reviews", href: `/agencies/${slug}`, active: true },
                { label: "Forum", href: `/agencies/${slug}/forum` },
                { label: "Jobs", href: `/agencies/${slug}/jobs` },
              ].map((tab) => (
                <Link key={tab.label} href={tab.href}
                  className={cn(
                    "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
                    tab.active ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-700"
                  )}>
                  {tab.label}
                </Link>
              ))}
            </div>

            {/* Reviews */}
            {reviews.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-slate-300" />
                </div>
                <p className="font-bold text-slate-700 mb-1">No reviews yet</p>
                <p className="text-sm text-slate-400 mb-4">Be the first to review {agency.name}</p>
                <Link href={`/agencies/${slug}/reviews/new`} className="btn-primary">
                  Write First Review
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="space-y-2">
                <Link href={`/agencies/${slug}/reviews/new`} className="btn-primary w-full justify-center">
                  Write a Review
                </Link>
                <Link href={`/agencies/${slug}/forum`} className="btn-secondary w-full justify-center">
                  <MessageSquare className="w-4 h-4" />View Forum
                </Link>
                <Link href={`/agencies/${slug}/jobs`} className="btn-secondary w-full justify-center">
                  <Briefcase className="w-4 h-4" />View Open Jobs
                </Link>
              </div>
            </div>

            {/* Agency info */}
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Agency Info</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Type</span>
                  <span className="font-semibold text-slate-800">{DISCIPLINE_LABELS[agency.discipline]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Location</span>
                  <span className="font-semibold text-slate-800">{agency.city}, {agency.state_abbr}</span>
                </div>
                {agency.employee_count && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Employees</span>
                    <span className="font-semibold text-slate-800">~{agency.employee_count.toLocaleString()}</span>
                  </div>
                )}
                {agency.website && (
                  <a href={agency.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium pt-1 transition-colors">
                    Official Website <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="card p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Community</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-slate-900">{reviews.length}</p>
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                    <Users className="w-3 h-3" />Reviews
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-slate-900">{agency.open_job_count ?? 0}</p>
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                    <Briefcase className="w-3 h-3" />Open Jobs
                  </p>
                </div>
              </div>
            </div>

            {/* Similar agencies */}
            {similarAgencies.length > 0 && (
              <div className="card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Similar Agencies in {agency.state_abbr}
                </p>
                <div className="space-y-1">
                  {similarAgencies.map((similar) => (
                    <Link
                      key={similar.id}
                      href={`/agencies/${similar.slug}`}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-red-600 transition-colors truncate">
                          {similar.name}
                        </p>
                        <p className="text-xs text-slate-400">{similar.city}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-slate-700">{similar.avg_overall.toFixed(1)}</span>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={`/rankings/${agency.discipline}/${agency.state_abbr}`}
                    className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors group mt-1"
                  >
                    <span className="text-xs text-slate-500 group-hover:text-red-600 transition-colors">
                      View all {DISCIPLINE_LABELS[agency.discipline]} in {agency.state_abbr}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </Link>
                </div>
              </div>
            )}

            {/* Claim / Claimed */}
            {(agency as Agency & { is_claimed?: boolean }).is_claimed ? (
              <div className="card p-5 border-emerald-100 bg-emerald-50">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-bold text-emerald-800">Official Agency Account</p>
                </div>
                <p className="text-xs text-emerald-600">
                  Actively managed by a verified department representative.
                </p>
              </div>
            ) : (
              <div className="card p-5 border-dashed border-2 border-slate-200">
                <p className="text-sm font-bold text-slate-700 mb-1">Are you from this agency?</p>
                <p className="text-xs text-slate-500 mb-3">
                  Claim your profile to respond to reviews, view analytics, and attract candidates.
                </p>
                <Link href={`/agencies/${slug}/claim`} className="btn-secondary w-full justify-center text-sm">
                  <Building2 className="w-3.5 h-3.5" />Claim This Agency
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ReviewCard({ review }: { review: ReviewWithVerified }) {
  const recommend = review.recommend;
  const date = new Date(review.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h4 className="font-bold text-slate-900 mb-1.5">{review.title}</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn("w-3.5 h-3.5",
                  s <= review.rating_overall ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
              ))}
            </div>
            <span className="text-slate-300 text-xs">·</span>
            <span className="text-xs font-semibold text-slate-600">{review.anonymous_alias}</span>
            {review.is_verified_officer && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
                <Shield className="w-2.5 h-2.5" />Verified Officer
              </span>
            )}
            <span className="text-slate-300 text-xs">·</span>
            <span className="text-xs text-slate-400">{date}</span>
          </div>
        </div>
        <span className={cn("badge text-xs shrink-0",
          recommend ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-600")}>
          <ThumbsUp className={cn("w-3 h-3 mr-1", !recommend && "rotate-180")} />
          {recommend ? "Recommends" : "Does not recommend"}
        </span>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed mb-3">{review.body}</p>

      {(review.pros || review.cons) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {review.pros && (
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <div className="text-xs font-bold text-emerald-700 mb-1.5">✓ Pros</div>
              <p className="text-xs text-emerald-900 leading-relaxed">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <div className="text-xs font-bold text-red-700 mb-1.5">✗ Cons</div>
              <p className="text-xs text-red-900 leading-relaxed">{review.cons}</p>
            </div>
          )}
        </div>
      )}

      {review.agency_response && (
        <div className="mt-4 bg-slate-50 border-l-4 border-slate-300 rounded-r-xl p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Official Agency Response</span>
            <span className="text-xs text-slate-400">
              · {new Date(review.agency_response.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{review.agency_response.body}</p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
        <span>{review.employment_status === "active" ? "Current" : "Former"} employee</span>
        {review.years_experience && <span>· {review.years_experience} years</span>}
      </div>
    </div>
  );
}

function avg(reviews: Review[], key: keyof Review): number {
  if (!reviews.length) return 0;
  const vals = reviews.map((r) => Number(r[key]) || 0);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
