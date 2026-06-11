/**
 * MutualAid — Migration status checker
 *
 * Probes the live database (via the service-role PostgREST API) to determine
 * which of migrations 002–005 have been applied.
 *
 * Usage: node scripts/check-migrations.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, "..", ".env.local");

const envContent = readFileSync(ENV_PATH, "utf8");
const getEnv = (key) => envContent.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim() ?? null;

const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Each check selects a column/table/function the migration creates.
// PostgREST errors mentioning the missing object ⇒ not applied.
const CHECKS = [
  {
    migration: "002 — Stripe columns",
    run: () => admin.from("user_profiles").select("stripe_customer_id").limit(1),
  },
  {
    migration: "002 — upvote RPC functions",
    run: () => admin.rpc("increment_thread_upvotes", { thread_id: "00000000-0000-0000-0000-000000000000" }),
    // updating a nonexistent row is fine — only "function not found" means missing
    missingIf: (error) => error && /function|schema cache/i.test(error.message),
  },
  {
    migration: "003 — content_reports table",
    run: () => admin.from("content_reports").select("id").limit(1),
  },
  {
    migration: "004 — review salary columns",
    run: () => admin.from("reviews").select("salary_amount").limit(1),
  },
  {
    migration: "005 — notifications table + triggers",
    run: () => admin.from("notifications").select("id").limit(1),
  },
];

console.log("🔍 Checking applied migrations…\n");

let pending = 0;
for (const check of CHECKS) {
  const { error } = await check.run();
  const missing = check.missingIf ? check.missingIf(error) : Boolean(error);
  if (missing) {
    pending++;
    console.log(`  ❌ ${check.migration} — NOT applied`);
  } else {
    console.log(`  ✅ ${check.migration} — applied`);
  }
}

if (pending === 0) {
  console.log("\n🎉 All migrations applied. You're fully up to date.");
} else {
  console.log(`\n⚠️  ${pending} migration check(s) pending.`);
  console.log("   Paste supabase/RUN_ME_pending_migrations.sql into the Supabase SQL Editor and run it,");
  console.log("   then run this script again to confirm.");
}
