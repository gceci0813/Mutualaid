"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, ChevronLeft, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const RATING_CATEGORIES = [
  { key: "rating_overall",     label: "Overall Rating",      required: true  },
  { key: "rating_culture",     label: "Work Culture"                         },
  { key: "rating_leadership",  label: "Leadership / Management"              },
  { key: "rating_worklife",    label: "Work-Life Balance"                    },
  { key: "rating_pay",         label: "Pay & Benefits"                       },
  { key: "rating_equipment",   label: "Training & Equipment"                 },
  { key: "rating_advancement", label: "Career Advancement"                   },
  { key: "rating_family",      label: "Family Friendliness"                  },
];

const STAR_LABELS = ["", "Terrible", "Poor", "Fair", "Good", "Excellent"];

function StarPicker({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  required?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-700 font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              className="p-0.5 focus:outline-none"
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onChange(s)}
            >
              <Star
                className={cn(
                  "w-6 h-6 transition-colors",
                  s <= (hovered || value)
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200 fill-slate-200"
                )}
              />
            </button>
          ))}
        </div>
        {(hovered || value) > 0 && (
          <span className="text-xs text-slate-500 w-14">
            {STAR_LABELS[hovered || value]}
          </span>
        )}
      </div>
    </div>
  );
}

type Params = Promise<{ slug: string }>;

export default function NewReviewPage({ params }: { params: Params }) {
  const { slug } = use(params);
  const router = useRouter();

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<"active" | "former" | "volunteer">("active");
  const [yearsExp, setYearsExp] = useState("");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ratings.rating_overall) {
      setError("Overall rating is required.");
      return;
    }
    if (recommend === null) {
      setError("Please indicate whether you recommend this agency.");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/agencies/${slug}/reviews/new`);
      return;
    }

    // Get agency id
    const { data: agency } = await supabase
      .from("agencies")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!agency) {
      setError("Agency not found.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("reviews").insert({
      agency_id: agency.id,
      user_id: user.id,
      anonymous_alias: user.user_metadata?.anonymous_alias ?? "Anonymous",
      title,
      body,
      pros,
      cons,
      ...ratings,
      employment_status: employmentStatus,
      years_experience: yearsExp ? parseInt(yearsExp) : null,
      recommend,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Review submitted!</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your anonymous review has been posted. Thank you for helping the community.
          </p>
          <Link href={`/agencies/${slug}`} className="btn-primary">
            Back to Agency
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-10 max-w-3xl">
      <Link
        href={`/agencies/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to agency
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Write a Review</h1>
      <p className="text-slate-500 text-sm mb-8">
        Your review is 100% anonymous. Your alias will be shown, never your identity.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ratings */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Ratings</h2>
          <div className="divide-y divide-slate-100">
            {RATING_CATEGORIES.map((cat) => (
              <StarPicker
                key={cat.key}
                label={cat.label}
                value={ratings[cat.key] ?? 0}
                onChange={(v) => setRatings((prev) => ({ ...prev, [cat.key]: v }))}
                required={cat.required}
              />
            ))}
          </div>
        </div>

        {/* Recommend */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-3">
            Would you recommend this agency to a colleague?
          </h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRecommend(true)}
              className={cn(
                "flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                recommend === true
                  ? "bg-green-50 border-green-500 text-green-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              👍 Yes, I recommend
            </button>
            <button
              type="button"
              onClick={() => setRecommend(false)}
              className={cn(
                "flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                recommend === false
                  ? "bg-red-50 border-red-400 text-red-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              👎 No, I don&apos;t recommend
            </button>
          </div>
        </div>

        {/* Written review */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Your Review</h2>

          <div>
            <label className="label" htmlFor="title">
              Review headline <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="input"
              placeholder="Summarize your experience in one line"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
            />
          </div>

          <div>
            <label className="label" htmlFor="body">
              Full review <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              className="input min-h-[120px] resize-y"
              placeholder="Share your honest experience..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={50}
            />
            <p className="text-xs text-slate-400 mt-1">Minimum 50 characters</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="pros">Pros</label>
              <textarea
                id="pros"
                className="input min-h-[80px] resize-none"
                placeholder="What&apos;s good about this agency?"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="cons">Cons</label>
              <textarea
                id="cons"
                className="input min-h-[80px] resize-none"
                placeholder="What could be improved?"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Employment info */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Employment Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <div className="flex gap-2 flex-wrap">
                {(["active", "former", "volunteer"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEmploymentStatus(s)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors",
                      employmentStatus === s
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {s === "active" ? "Current" : s === "former" ? "Former" : "Volunteer"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="years">Years of experience (optional)</label>
              <input
                id="years"
                type="number"
                className="input"
                placeholder="e.g. 8"
                value={yearsExp}
                onChange={(e) => setYearsExp(e.target.value)}
                min={0}
                max={50}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Submitted anonymously. Your alias will be shown, not your email.
          </p>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </form>
    </div>
  );
}
