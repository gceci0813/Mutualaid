import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Star, Users, Briefcase, MessageSquare,
  ExternalLink, Shield, ChevronRight, ThumbsUp
} from "lucide-react";
import { cn, DISCIPLINE_LABELS, DISCIPLINE_COLORS } from "@/lib/utils";
import type { Agency, Review } from "@/types";

async function getAgency(slug: string): Promise<Agency | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agencies")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as Agency | null;
}

async function getReviews(agencyId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(10);
  return (data as Review[]) ?? [];
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div
          className="bg-red-500 h-2 rounded-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-800 w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            sz,
            s <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-slate-200 fill-slate-200"
          )}
        />
      ))}
    </div>
  );
}

export default async function AgencyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [agency, reviews] = await Promise.all([
    getAgency(slug),
    getAgency(slug).then((a) => (a ? getReviews(a.id) : [])),
  ]);

  if (!agency) notFound();

  const ratings = reviews.length
    ? {
        overall: avg(reviews, "rating_overall"),
        culture: avg(reviews, "rating_culture"),
        leadership: avg(reviews, "rating_leadership"),
        worklife: avg(reviews, "rating_worklife"),
        pay: avg(reviews, "rating_pay"),
        equipment: avg(reviews, "rating_equipment"),
        advancement: avg(reviews, "rating_advancement"),
        family: avg(reviews, "rating_family"),
      }
    : null;

  return (
    <div className="page-container py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-6">
        <Link href="/agencies" className="hover:text-slate-700">Agencies</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">{agency.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agency header */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("badge", DISCIPLINE_COLORS[agency.discipline])}>
                    {DISCIPLINE_LABELS[agency.discipline]}
                  </span>
                  {agency.verified && (
                    <span className="badge bg-blue-50 text-blue-700">
                      <Shield className="w-3 h-3 mr-1" /> Verified
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{agency.name}</h1>
                <p className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  {agency.city}, {agency.state}
                  {agency.county ? `, ${agency.county} County` : ""}
                </p>
              </div>

              <Link
                href={`/agencies/${slug}/reviews/new`}
                className="btn-primary shrink-0"
              >
                Write a Review
              </Link>
            </div>

            {ratings && (
              <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-slate-900">
                    {ratings.overall.toFixed(1)}
                  </div>
                  <StarDisplay rating={ratings.overall} size="lg" />
                  <div className="text-xs text-slate-400 mt-1">
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <RatingBar label="Work Culture" value={ratings.culture} />
                  <RatingBar label="Leadership" value={ratings.leadership} />
                  <RatingBar label="Work-Life" value={ratings.worklife} />
                  <RatingBar label="Pay & Benefits" value={ratings.pay} />
                  <RatingBar label="Equipment" value={ratings.equipment} />
                </div>
              </div>
            )}
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 border-b border-slate-200">
            {[
              { label: "Reviews", href: `/agencies/${slug}`, active: true },
              { label: "Forum", href: `/agencies/${slug}/forum` },
              { label: "Jobs", href: `/agencies/${slug}/jobs` },
            ].map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab.active
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Reviews */}
          {reviews.length === 0 ? (
            <div className="card p-10 text-center text-slate-400">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-slate-600">No reviews yet</p>
              <p className="text-sm mt-1">Be the first to review {agency.name}</p>
              <Link href={`/agencies/${slug}/reviews/new`} className="btn-primary mt-4">
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
            <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/agencies/${slug}/reviews/new`} className="btn-primary w-full justify-center">
                Write a Review
              </Link>
              <Link href={`/agencies/${slug}/forum`} className="btn-secondary w-full justify-center">
                <MessageSquare className="w-4 h-4" />
                View Forum Threads
              </Link>
              <Link href={`/agencies/${slug}/jobs`} className="btn-secondary w-full justify-center">
                <Briefcase className="w-4 h-4" />
                View Open Jobs
              </Link>
            </div>
          </div>

          {/* Agency info */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Agency Info</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-medium text-slate-800">{DISCIPLINE_LABELS[agency.discipline]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location</span>
                <span className="font-medium text-slate-800">{agency.city}, {agency.state_abbr}</span>
              </div>
              {agency.employee_count && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Employees</span>
                  <span className="font-medium text-slate-800">~{agency.employee_count.toLocaleString()}</span>
                </div>
              )}
              {agency.website && (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-red-600 hover:text-red-700 mt-2"
                >
                  Official Website
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Community Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  Reviews
                </span>
                <span className="font-bold text-slate-800">{reviews.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Briefcase className="w-3.5 h-3.5" />
                  Open Jobs
                </span>
                <span className="font-bold text-slate-800">{agency.open_job_count ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const recommend = review.recommend;
  const date = new Date(review.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h4 className="font-semibold text-slate-900">{review.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "w-3.5 h-3.5",
                    s <= review.rating_overall
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-200 fill-slate-200"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{review.anonymous_alias}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400">{date}</span>
          </div>
        </div>
        <span
          className={cn(
            "badge text-xs",
            recommend ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
          )}
        >
          <ThumbsUp className={cn("w-3 h-3 mr-1", !recommend && "rotate-180")} />
          {recommend ? "Recommends" : "Does not recommend"}
        </span>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed mb-3">{review.body}</p>

      {(review.pros || review.cons) && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {review.pros && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-green-700 mb-1">Pros</div>
              <p className="text-xs text-green-900 leading-relaxed">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-red-700 mb-1">Cons</div>
              <p className="text-xs text-red-900 leading-relaxed">{review.cons}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
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
