import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured, PLAN_PRICE_ENV } from "@/lib/stripe";

const SUBSCRIPTION_PLANS = ["premium", "basic", "pro"] as const;
const ONE_TIME_PLANS = ["featured_job"] as const;
type Plan = (typeof SUBSCRIPTION_PLANS)[number] | (typeof ONE_TIME_PLANS)[number];

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured yet. Set STRIPE_SECRET_KEY to enable checkout." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, claimId, jobId } = (await req.json()) as {
    plan?: string; claimId?: string; jobId?: string;
  };

  const isSubscription = SUBSCRIPTION_PLANS.includes(plan as typeof SUBSCRIPTION_PLANS[number]);
  const isOneTime = ONE_TIME_PLANS.includes(plan as typeof ONE_TIME_PLANS[number]);
  if (!plan || (!isSubscription && !isOneTime)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const priceId = PLAN_PRICE_ENV[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: `Price for plan "${plan}" is not configured.` },
      { status: 503 }
    );
  }

  // Employer plans must be tied to one of the user's own claims
  if (plan === "basic" || plan === "pro") {
    if (!claimId) {
      return NextResponse.json({ error: "claimId is required for employer plans." }, { status: 400 });
    }
    const { data: claim } = await supabase
      .from("agency_claims")
      .select("id, claimed_by")
      .eq("id", claimId)
      .eq("claimed_by", user.id)
      .single();
    if (!claim) {
      return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    }
  }

  // Featured job must be one of the user's own listings
  if (plan === "featured_job") {
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required to feature a listing." }, { status: 400 });
    }
    const { data: job } = await supabase
      .from("jobs")
      .select("id, posted_by_user_id, is_featured")
      .eq("id", jobId)
      .eq("posted_by_user_id", user.id)
      .single();
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    if (job.is_featured) {
      return NextResponse.json({ error: "This listing is already featured." }, { status: 409 });
    }
  }

  const origin = req.nextUrl.origin;
  const stripe = getStripe();

  const metadata = {
    user_id: user.id,
    plan: plan as Plan,
    ...(claimId && { claim_id: claimId }),
    ...(jobId && { job_id: jobId }),
  };

  const session = await stripe.checkout.sessions.create({
    mode: isOneTime ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url:
      plan === "premium" ? `${origin}/dashboard?checkout=success`
      : plan === "featured_job" ? `${origin}/jobs/${jobId}?featured=success`
      : `${origin}/dashboard/agency?checkout=success`,
    cancel_url:
      plan === "featured_job" ? `${origin}/jobs/${jobId}?featured=cancelled`
      : `${origin}/pricing?checkout=cancelled`,
    ...(user.email && { customer_email: user.email }),
    metadata,
    ...(isSubscription && { subscription_data: { metadata } }),
  });

  return NextResponse.json({ url: session.url });
}
