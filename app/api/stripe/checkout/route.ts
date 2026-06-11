import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured, PLAN_PRICE_ENV } from "@/lib/stripe";

const VALID_PLANS = ["premium", "basic", "pro"] as const;
type Plan = (typeof VALID_PLANS)[number];

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

  const { plan, claimId } = (await req.json()) as { plan?: string; claimId?: string };

  if (!plan || !VALID_PLANS.includes(plan as Plan)) {
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

  const origin = req.nextUrl.origin;
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url:
      plan === "premium"
        ? `${origin}/dashboard?checkout=success`
        : `${origin}/dashboard/agency?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    ...(user.email && { customer_email: user.email }),
    metadata: {
      user_id: user.id,
      plan,
      ...(claimId && { claim_id: claimId }),
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan,
        ...(claimId && { claim_id: claimId }),
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
