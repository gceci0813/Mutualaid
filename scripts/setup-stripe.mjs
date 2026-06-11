/**
 * MutualAid — Stripe one-shot setup
 *
 * Creates (idempotently):
 *   1. Four products + prices:
 *        Premium        $4.99/mo   (individual)
 *        Agency Basic   $99/mo     (employer)
 *        Agency Pro     $249/mo    (employer)
 *        Featured Job   $99 one-time
 *   2. A webhook endpoint at <SITE_URL>/api/stripe/webhook
 *      (events: checkout.session.completed, customer.subscription.deleted)
 *   3. Writes STRIPE_PRICE_* and STRIPE_WEBHOOK_SECRET back into .env.local
 *
 * Prereq: put STRIPE_SECRET_KEY=sk_... into .env.local first
 *         (test key sk_test_... or live key sk_live_... both work)
 *
 * Usage: node scripts/setup-stripe.mjs
 */

import Stripe from "stripe";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, "..", ".env.local");
const SITE_URL = "https://mutualaid-seven.vercel.app";

let envContent = readFileSync(ENV_PATH, "utf8");
const getEnv = (key) => envContent.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim() ?? null;

const SECRET_KEY = getEnv("STRIPE_SECRET_KEY");
if (!SECRET_KEY || SECRET_KEY.startsWith("sk_") === false) {
  console.error("❌ No STRIPE_SECRET_KEY found in .env.local");
  console.error("   1. Go to https://dashboard.stripe.com/apikeys");
  console.error("   2. Copy the Secret key (sk_test_... for test mode, sk_live_... for live)");
  console.error("   3. Add this line to .env.local:  STRIPE_SECRET_KEY=sk_...");
  console.error("   4. Run this script again.");
  process.exit(1);
}

const mode = SECRET_KEY.startsWith("sk_test_") ? "TEST" : "LIVE";
const stripe = new Stripe(SECRET_KEY);

console.log(`🔧 MutualAid — Stripe setup (${mode} mode)\n`);

// ── Products & prices ─────────────────────────────────────────────
const PLANS = [
  {
    envKey: "STRIPE_PRICE_PREMIUM",
    lookupKey: "mutualaid_premium",
    name: "MutualAid Premium",
    description: "Individual premium: salary analytics, advanced filtering, ad-free.",
    unit_amount: 499,
    recurring: { interval: "month" },
  },
  {
    envKey: "STRIPE_PRICE_BASIC",
    lookupKey: "mutualaid_agency_basic",
    name: "MutualAid Agency Basic",
    description: "Agency plan: verified badge, respond to reviews, sentiment dashboard.",
    unit_amount: 9900,
    recurring: { interval: "month" },
  },
  {
    envKey: "STRIPE_PRICE_PRO",
    lookupKey: "mutualaid_agency_pro",
    name: "MutualAid Agency Pro",
    description: "Agency Pro: full analytics, recruitment insights, priority placement.",
    unit_amount: 24900,
    recurring: { interval: "month" },
  },
  {
    envKey: "STRIPE_PRICE_FEATURED_JOB",
    lookupKey: "mutualaid_featured_job",
    name: "MutualAid Featured Job Listing",
    description: "30-day featured placement at the top of the job board.",
    unit_amount: 9900,
    recurring: null,
  },
];

const newEnvVars = {};

for (const plan of PLANS) {
  // Idempotency: reuse an existing active price with this lookup_key
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookupKey], limit: 1 });
  if (existing.data.length > 0) {
    newEnvVars[plan.envKey] = existing.data[0].id;
    console.log(`  ♻️  ${plan.name} — exists (${existing.data[0].id})`);
    continue;
  }

  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: plan.unit_amount,
    lookup_key: plan.lookupKey,
    ...(plan.recurring && { recurring: plan.recurring }),
  });
  newEnvVars[plan.envKey] = price.id;
  const amount = `$${(plan.unit_amount / 100).toFixed(2)}${plan.recurring ? "/mo" : " one-time"}`;
  console.log(`  ✅ ${plan.name} — created ${amount} (${price.id})`);
}

// ── Webhook endpoint ──────────────────────────────────────────────
const WEBHOOK_URL = `${SITE_URL}/api/stripe/webhook`;
const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
let hook = hooks.data.find((h) => h.url === WEBHOOK_URL);

if (hook) {
  console.log(`  ♻️  Webhook — exists (${hook.id})`);
  if (!getEnv("STRIPE_WEBHOOK_SECRET")) {
    console.log("     ⚠️  Signing secret is only revealed at creation. If you don't have it,");
    console.log("        delete the endpoint in the Stripe dashboard and re-run this script.");
  }
} else {
  hook = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: ["checkout.session.completed", "customer.subscription.deleted"],
    description: "MutualAid subscription + featured-job fulfillment",
  });
  newEnvVars["STRIPE_WEBHOOK_SECRET"] = hook.secret;
  console.log(`  ✅ Webhook — created → ${WEBHOOK_URL}`);
}

// ── Write back to .env.local ──────────────────────────────────────
for (const [key, value] of Object.entries(newEnvVars)) {
  if (envContent.match(new RegExp(`^${key}=`, "m"))) {
    envContent = envContent.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }
}
writeFileSync(ENV_PATH, envContent.endsWith("\n") ? envContent : envContent + "\n");

console.log("\n📝 .env.local updated. Vars your VERCEL project needs (Settings → Environment Variables):\n");
const VARS = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_PREMIUM", "STRIPE_PRICE_BASIC", "STRIPE_PRICE_PRO", "STRIPE_PRICE_FEATURED_JOB"];
const finalEnv = readFileSync(ENV_PATH, "utf8");
for (const key of VARS) {
  const val = finalEnv.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1] ?? "(missing!)";
  console.log(`  ${key}=${val}`);
}
console.log(`\n   Or with the CLI:  vercel login  →  then re-run with --push-vercel`);
console.log(`\n🎉 Stripe ${mode} mode configured.`);
