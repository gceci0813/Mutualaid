import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 503 });
  }

  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const { user_id, plan, claim_id, job_id } = session.metadata ?? {};
      if (!user_id || !plan) break;

      if (plan === "featured_job" && job_id) {
        await admin
          .from("jobs")
          .update({
            is_featured: true,
            featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", job_id);
      } else if (plan === "premium") {
        await admin
          .from("user_profiles")
          .update({
            subscription_tier: "premium",
            stripe_customer_id: session.customer as string | null,
          })
          .eq("id", user_id);
      } else if ((plan === "basic" || plan === "pro") && claim_id) {
        await admin
          .from("agency_claims")
          .update({ active: true, plan, stripe_customer_id: session.customer as string | null })
          .eq("id", claim_id);
        // Mark agency as claimed
        const { data: claim } = await admin
          .from("agency_claims")
          .select("agency_id")
          .eq("id", claim_id)
          .single();
        if (claim?.agency_id) {
          await admin.from("agencies").update({ is_claimed: true }).eq("id", claim.agency_id);
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const { user_id, plan, claim_id } = subscription.metadata ?? {};
      if (!user_id || !plan) break;

      if (plan === "premium") {
        await admin
          .from("user_profiles")
          .update({ subscription_tier: "free" })
          .eq("id", user_id);
      } else if ((plan === "basic" || plan === "pro") && claim_id) {
        await admin.from("agency_claims").update({ active: false }).eq("id", claim_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
