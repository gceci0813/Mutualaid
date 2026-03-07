/**
 * MutualAid — Verification Feature Setup Script
 *
 * 1. Fetches the first admin user email and writes it to .env.local
 * 2. Checks which schema changes are already applied
 * 3. Prints the exact SQL that still needs to run in Supabase SQL Editor
 *
 * Usage: node scripts/setup-verification.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");

// Load env
const envContent = readFileSync(ENV_PATH, "utf8");
function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const ADMIN_EMAILS = getEnv("ADMIN_EMAILS");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("🔧 MutualAid — Verification Feature Setup\n");

// ── Step 1: Get admin email ───────────────────────────────────────────────────
let adminEmail = ADMIN_EMAILS;
if (!ADMIN_EMAILS) {
  console.log("📧 Fetching users to determine admin email...");
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 50 });
  if (error) {
    console.error("   ⚠️  Could not list users:", error.message);
  } else {
    const users = data?.users ?? [];
    console.log(`   Found ${users.length} user(s):`);
    users.forEach((u, i) => console.log(`   ${i + 1}. ${u.email}`));

    if (users.length === 1) {
      adminEmail = users[0].email;
    } else if (users.length > 1) {
      // Use the oldest account (most likely the project creator)
      const sorted = [...users].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      adminEmail = sorted[0].email;
      console.log(`   → Selecting oldest account as admin: ${adminEmail}`);
    }
  }
}

if (adminEmail && !ADMIN_EMAILS) {
  const updated = envContent + `\nADMIN_EMAILS=${adminEmail}\n`;
  writeFileSync(ENV_PATH, updated);
  console.log(`✅ Added ADMIN_EMAILS=${adminEmail} to .env.local\n`);
} else if (ADMIN_EMAILS) {
  console.log(`✅ ADMIN_EMAILS already set: ${ADMIN_EMAILS}\n`);
} else {
  console.log("⚠️  Could not determine admin email — add ADMIN_EMAILS=you@example.com to .env.local manually\n");
}

// ── Step 2: Check schema state ────────────────────────────────────────────────
console.log("🔍 Checking current schema state...\n");

const checks = {
  agency_access_codes_table: false,
  is_verified_officer_column: false,
  verified_agency_id_column: false,
  profiles_public_read_policy: false,
};

// Check agency_access_codes table
const { error: tableErr } = await admin
  .from("agency_access_codes")
  .select("id")
  .limit(0);
checks.agency_access_codes_table = !tableErr;
console.log(`  agency_access_codes table:    ${checks.agency_access_codes_table ? "✅ exists" : "❌ missing"}`);

// Check is_verified_officer column
const { error: colErr1 } = await admin
  .from("user_profiles")
  .select("is_verified_officer")
  .limit(0);
checks.is_verified_officer_column = !colErr1;
console.log(`  is_verified_officer column:   ${checks.is_verified_officer_column ? "✅ exists" : "❌ missing"}`);

// Check verified_agency_id column
const { error: colErr2 } = await admin
  .from("user_profiles")
  .select("verified_agency_id")
  .limit(0);
checks.verified_agency_id_column = !colErr2;
console.log(`  verified_agency_id column:    ${checks.verified_agency_id_column ? "✅ exists" : "❌ missing"}`);

// ── Step 3: Generate required SQL ─────────────────────────────────────────────
const sqlParts = [];

if (!checks.agency_access_codes_table) {
  sqlParts.push(`-- Create agency_access_codes table
create table if not exists agency_access_codes (
  id                uuid primary key default uuid_generate_v4(),
  agency_id         uuid not null references agencies(id) on delete cascade,
  code              text not null unique,
  created_at        timestamptz default now(),
  used_by_user_id   uuid references auth.users(id) on delete set null,
  used_at           timestamptz
);
create index if not exists codes_agency_idx on agency_access_codes (agency_id);
create index if not exists codes_used_idx   on agency_access_codes (used_by_user_id);
alter table agency_access_codes enable row level security;`);
}

if (!checks.is_verified_officer_column) {
  sqlParts.push(`-- Add is_verified_officer to user_profiles
alter table user_profiles
  add column if not exists is_verified_officer boolean default false;`);
}

if (!checks.verified_agency_id_column) {
  sqlParts.push(`-- Add verified_agency_id to user_profiles
alter table user_profiles
  add column if not exists verified_agency_id uuid references agencies(id) on delete set null;`);
}

// Always suggest profile policy update (can't easily check current policies via REST)
sqlParts.push(`-- Allow public read of user_profiles (only alias + verified status stored — no PII)
-- Run this even if already applied; it's idempotent via "if not exists" equivalent:
drop policy if exists "profiles_own_select" on user_profiles;
create policy if not exists "profiles_public_read" on user_profiles for select using (true);`);

console.log("\n");

const allDone = checks.agency_access_codes_table &&
  checks.is_verified_officer_column &&
  checks.verified_agency_id_column;

if (allDone) {
  console.log("🎉 Schema is up to date! Just run the policy SQL below to finish.\n");
} else {
  console.log("📋 Run the following SQL in your Supabase SQL Editor:");
  console.log("   https://supabase.com/dashboard/project/xqgrqlsjrmntpiowucml/sql/new\n");
}

const fullSQL = sqlParts.join("\n\n");
console.log("━".repeat(60));
console.log(fullSQL);
console.log("━".repeat(60));
console.log("\n✅ Copy everything between the lines and paste it into the Supabase SQL Editor → Run\n");
