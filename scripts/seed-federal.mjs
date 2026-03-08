/**
 * MutualAid — Federal Law Enforcement Agency Seed Script
 *
 * Seeds the agencies table with major federal law enforcement agencies and
 * their field offices across the US.
 *
 * Agencies covered:
 *   DOJ:  FBI, ATF, DEA, USMS (US Marshals)
 *   DHS:  ICE (HSI + ERO), CBP (Border Patrol), TSA, USSS, Coast Guard
 *   Other: US Capitol Police, Park Police, Pentagon Force Protection
 *
 * Field offices seeded for FBI, ATF, DEA, ICE-HSI, CBP.
 * HQ records seeded for all agencies.
 *
 * Usage:
 *   node scripts/seed-federal.mjs
 *
 * Required env vars (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const raw = readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const [k, ...v] = t.split("=");
      process.env[k.trim()] = v.join("=").trim();
    }
  } catch { console.log("No .env.local — using existing env vars."); }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 200);
}
function makeUniqueSlug(base, seen) {
  let s = base, n = 2;
  while (seen.has(s)) s = `${base}-${n++}`;
  seen.add(s);
  return s;
}
async function upsertBatch(rows) {
  const { error } = await supabase.from("agencies").upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
  if (error) throw error;
}

// ── Agency definitions ────────────────────────────────────────────────────────

// FBI field offices (56 divisions)
const FBI_OFFICES = [
  { city: "Washington", state: "District of Columbia", state_abbr: "DC", label: "FBI Washington Field Office" },
  { city: "New York",     state: "New York",          state_abbr: "NY", label: "FBI New York Field Office" },
  { city: "Los Angeles",  state: "California",        state_abbr: "CA", label: "FBI Los Angeles Field Office" },
  { city: "Chicago",      state: "Illinois",          state_abbr: "IL", label: "FBI Chicago Field Office" },
  { city: "Houston",      state: "Texas",             state_abbr: "TX", label: "FBI Houston Field Office" },
  { city: "Miami",        state: "Florida",           state_abbr: "FL", label: "FBI Miami Field Office" },
  { city: "San Francisco",state: "California",        state_abbr: "CA", label: "FBI San Francisco Field Office" },
  { city: "Atlanta",      state: "Georgia",           state_abbr: "GA", label: "FBI Atlanta Field Office" },
  { city: "Dallas",       state: "Texas",             state_abbr: "TX", label: "FBI Dallas Field Office" },
  { city: "Denver",       state: "Colorado",          state_abbr: "CO", label: "FBI Denver Field Office" },
  { city: "Boston",       state: "Massachusetts",     state_abbr: "MA", label: "FBI Boston Field Office" },
  { city: "Philadelphia", state: "Pennsylvania",      state_abbr: "PA", label: "FBI Philadelphia Field Office" },
  { city: "Phoenix",      state: "Arizona",           state_abbr: "AZ", label: "FBI Phoenix Field Office" },
  { city: "Seattle",      state: "Washington",        state_abbr: "WA", label: "FBI Seattle Field Office" },
  { city: "Minneapolis",  state: "Minnesota",         state_abbr: "MN", label: "FBI Minneapolis Field Office" },
  { city: "Detroit",      state: "Michigan",          state_abbr: "MI", label: "FBI Detroit Field Office" },
  { city: "Baltimore",    state: "Maryland",          state_abbr: "MD", label: "FBI Baltimore Field Office" },
  { city: "Cleveland",    state: "Ohio",              state_abbr: "OH", label: "FBI Cleveland Field Office" },
  { city: "Tampa",        state: "Florida",           state_abbr: "FL", label: "FBI Tampa Field Office" },
  { city: "Sacramento",   state: "California",        state_abbr: "CA", label: "FBI Sacramento Field Office" },
  { city: "Portland",     state: "Oregon",            state_abbr: "OR", label: "FBI Portland Field Office" },
  { city: "Kansas City",  state: "Missouri",          state_abbr: "MO", label: "FBI Kansas City Field Office" },
  { city: "Indianapolis", state: "Indiana",           state_abbr: "IN", label: "FBI Indianapolis Field Office" },
  { city: "Nashville",    state: "Tennessee",         state_abbr: "TN", label: "FBI Memphis Field Office" },
  { city: "New Orleans",  state: "Louisiana",         state_abbr: "LA", label: "FBI New Orleans Field Office" },
  { city: "Newark",       state: "New Jersey",        state_abbr: "NJ", label: "FBI Newark Field Office" },
  { city: "Pittsburgh",   state: "Pennsylvania",      state_abbr: "PA", label: "FBI Pittsburgh Field Office" },
  { city: "Richmond",     state: "Virginia",          state_abbr: "VA", label: "FBI Richmond Field Office" },
  { city: "St. Louis",    state: "Missouri",          state_abbr: "MO", label: "FBI St. Louis Field Office" },
  { city: "Salt Lake City", state: "Utah",            state_abbr: "UT", label: "FBI Salt Lake City Field Office" },
  { city: "Albuquerque",  state: "New Mexico",        state_abbr: "NM", label: "FBI Albuquerque Field Office" },
  { city: "Anchorage",    state: "Alaska",            state_abbr: "AK", label: "FBI Anchorage Field Office" },
  { city: "Birmingham",   state: "Alabama",           state_abbr: "AL", label: "FBI Birmingham Field Office" },
  { city: "Charlotte",    state: "North Carolina",    state_abbr: "NC", label: "FBI Charlotte Field Office" },
  { city: "Cincinnati",   state: "Ohio",              state_abbr: "OH", label: "FBI Cincinnati Field Office" },
  { city: "Columbia",     state: "South Carolina",    state_abbr: "SC", label: "FBI Columbia Field Office" },
  { city: "El Paso",      state: "Texas",             state_abbr: "TX", label: "FBI El Paso Field Office" },
  { city: "Honolulu",     state: "Hawaii",            state_abbr: "HI", label: "FBI Honolulu Field Office" },
  { city: "Jackson",      state: "Mississippi",       state_abbr: "MS", label: "FBI Jackson Field Office" },
  { city: "Jacksonville", state: "Florida",           state_abbr: "FL", label: "FBI Jacksonville Field Office" },
  { city: "Las Vegas",    state: "Nevada",            state_abbr: "NV", label: "FBI Las Vegas Field Office" },
  { city: "Little Rock",  state: "Arkansas",          state_abbr: "AR", label: "FBI Little Rock Field Office" },
  { city: "Louisville",   state: "Kentucky",          state_abbr: "KY", label: "FBI Louisville Field Office" },
  { city: "Mobile",       state: "Alabama",           state_abbr: "AL", label: "FBI Mobile Field Office" },
  { city: "Norfolk",      state: "Virginia",          state_abbr: "VA", label: "FBI Norfolk Field Office" },
  { city: "Oklahoma City",state: "Oklahoma",          state_abbr: "OK", label: "FBI Oklahoma City Field Office" },
  { city: "Omaha",        state: "Nebraska",          state_abbr: "NE", label: "FBI Omaha Field Office" },
  { city: "San Antonio",  state: "Texas",             state_abbr: "TX", label: "FBI San Antonio Field Office" },
  { city: "San Diego",    state: "California",        state_abbr: "CA", label: "FBI San Diego Field Office" },
  { city: "San Juan",     state: "Puerto Rico",       state_abbr: "PR", label: "FBI San Juan Field Office" },
  { city: "Springfield",  state: "Illinois",          state_abbr: "IL", label: "FBI Springfield Field Office" },
  { city: "Albany",       state: "New York",          state_abbr: "NY", label: "FBI Albany Field Office" },
  { city: "Baton Rouge",  state: "Louisiana",         state_abbr: "LA", label: "FBI Baton Rouge Resident Agency" },
  { city: "Buffalo",      state: "New York",          state_abbr: "NY", label: "FBI Buffalo Field Office" },
  { city: "San Jose",     state: "California",        state_abbr: "CA", label: "FBI San Jose Resident Agency" },
  { city: "Quantico",     state: "Virginia",          state_abbr: "VA", label: "FBI Headquarters — Quantico" },
];

// ATF field offices
const ATF_OFFICES = [
  { city: "Washington",   state: "District of Columbia", state_abbr: "DC", label: "ATF Headquarters" },
  { city: "New York",     state: "New York",          state_abbr: "NY", label: "ATF New York Field Division" },
  { city: "Los Angeles",  state: "California",        state_abbr: "CA", label: "ATF Los Angeles Field Division" },
  { city: "Chicago",      state: "Illinois",          state_abbr: "IL", label: "ATF Chicago Field Division" },
  { city: "Houston",      state: "Texas",             state_abbr: "TX", label: "ATF Houston Field Division" },
  { city: "Atlanta",      state: "Georgia",           state_abbr: "GA", label: "ATF Atlanta Field Division" },
  { city: "Dallas",       state: "Texas",             state_abbr: "TX", label: "ATF Dallas Field Division" },
  { city: "Miami",        state: "Florida",           state_abbr: "FL", label: "ATF Miami Field Division" },
  { city: "Philadelphia", state: "Pennsylvania",      state_abbr: "PA", label: "ATF Philadelphia Field Division" },
  { city: "San Francisco",state: "California",        state_abbr: "CA", label: "ATF San Francisco Field Division" },
  { city: "Baltimore",    state: "Maryland",          state_abbr: "MD", label: "ATF Baltimore Field Division" },
  { city: "Boston",       state: "Massachusetts",     state_abbr: "MA", label: "ATF Boston Field Division" },
  { city: "Charlotte",    state: "North Carolina",    state_abbr: "NC", label: "ATF Charlotte Field Division" },
  { city: "Columbus",     state: "Ohio",              state_abbr: "OH", label: "ATF Columbus Field Division" },
  { city: "Denver",       state: "Colorado",          state_abbr: "CO", label: "ATF Denver Field Division" },
  { city: "Detroit",      state: "Michigan",          state_abbr: "MI", label: "ATF Detroit Field Division" },
  { city: "Kansas City",  state: "Missouri",          state_abbr: "MO", label: "ATF Kansas City Field Division" },
  { city: "Louisville",   state: "Kentucky",          state_abbr: "KY", label: "ATF Louisville Field Division" },
  { city: "Nashville",    state: "Tennessee",         state_abbr: "TN", label: "ATF Nashville Field Division" },
  { city: "New Orleans",  state: "Louisiana",         state_abbr: "LA", label: "ATF New Orleans Field Division" },
  { city: "Newark",       state: "New Jersey",        state_abbr: "NJ", label: "ATF Newark Field Division" },
  { city: "Phoenix",      state: "Arizona",           state_abbr: "AZ", label: "ATF Phoenix Field Division" },
  { city: "Seattle",      state: "Washington",        state_abbr: "WA", label: "ATF Seattle Field Division" },
  { city: "St. Paul",     state: "Minnesota",         state_abbr: "MN", label: "ATF St. Paul Field Division" },
  { city: "Tampa",        state: "Florida",           state_abbr: "FL", label: "ATF Tampa Field Division" },
  { city: "Washington",   state: "District of Columbia", state_abbr: "DC", label: "ATF Washington Field Division" },
];

// DEA field offices
const DEA_OFFICES = [
  { city: "Arlington",    state: "Virginia",          state_abbr: "VA", label: "DEA Headquarters" },
  { city: "Atlanta",      state: "Georgia",           state_abbr: "GA", label: "DEA Atlanta Field Division" },
  { city: "Boston",       state: "Massachusetts",     state_abbr: "MA", label: "DEA Boston Field Division" },
  { city: "Caribbean",    state: "Puerto Rico",       state_abbr: "PR", label: "DEA Caribbean Division" },
  { city: "Chicago",      state: "Illinois",          state_abbr: "IL", label: "DEA Chicago Field Division" },
  { city: "Dallas",       state: "Texas",             state_abbr: "TX", label: "DEA Dallas Field Division" },
  { city: "Denver",       state: "Colorado",          state_abbr: "CO", label: "DEA Denver Field Division" },
  { city: "Detroit",      state: "Michigan",          state_abbr: "MI", label: "DEA Detroit Field Division" },
  { city: "El Paso",      state: "Texas",             state_abbr: "TX", label: "DEA El Paso Division" },
  { city: "Houston",      state: "Texas",             state_abbr: "TX", label: "DEA Houston Field Division" },
  { city: "Los Angeles",  state: "California",        state_abbr: "CA", label: "DEA Los Angeles Field Division" },
  { city: "Miami",        state: "Florida",           state_abbr: "FL", label: "DEA Miami Field Division" },
  { city: "New Orleans",  state: "Louisiana",         state_abbr: "LA", label: "DEA New Orleans Field Division" },
  { city: "New York",     state: "New York",          state_abbr: "NY", label: "DEA New York Field Division" },
  { city: "Philadelphia", state: "Pennsylvania",      state_abbr: "PA", label: "DEA Philadelphia Field Division" },
  { city: "Phoenix",      state: "Arizona",           state_abbr: "AZ", label: "DEA Phoenix Field Division" },
  { city: "San Diego",    state: "California",        state_abbr: "CA", label: "DEA San Diego Field Division" },
  { city: "San Francisco",state: "California",        state_abbr: "CA", label: "DEA San Francisco Field Division" },
  { city: "Seattle",      state: "Washington",        state_abbr: "WA", label: "DEA Seattle Field Division" },
  { city: "St. Louis",    state: "Missouri",          state_abbr: "MO", label: "DEA St. Louis Field Division" },
  { city: "Washington",   state: "District of Columbia", state_abbr: "DC", label: "DEA Washington DC Field Division" },
];

// ICE (HSI + ERO) major offices
const ICE_OFFICES = [
  { city: "Washington",   state: "District of Columbia", state_abbr: "DC", label: "ICE Headquarters" },
  { city: "New York",     state: "New York",          state_abbr: "NY", label: "ICE HSI New York" },
  { city: "Los Angeles",  state: "California",        state_abbr: "CA", label: "ICE HSI Los Angeles" },
  { city: "Miami",        state: "Florida",           state_abbr: "FL", label: "ICE HSI Miami" },
  { city: "Chicago",      state: "Illinois",          state_abbr: "IL", label: "ICE HSI Chicago" },
  { city: "Dallas",       state: "Texas",             state_abbr: "TX", label: "ICE HSI Dallas" },
  { city: "Houston",      state: "Texas",             state_abbr: "TX", label: "ICE HSI Houston" },
  { city: "Washington",   state: "District of Columbia", state_abbr: "DC", label: "ICE HSI Washington DC" },
  { city: "Atlanta",      state: "Georgia",           state_abbr: "GA", label: "ICE HSI Atlanta" },
  { city: "Phoenix",      state: "Arizona",           state_abbr: "AZ", label: "ICE HSI Phoenix" },
  { city: "San Diego",    state: "California",        state_abbr: "CA", label: "ICE HSI San Diego" },
  { city: "El Paso",      state: "Texas",             state_abbr: "TX", label: "ICE HSI El Paso" },
  { city: "San Antonio",  state: "Texas",             state_abbr: "TX", label: "ICE HSI San Antonio" },
  { city: "San Francisco",state: "California",        state_abbr: "CA", label: "ICE HSI San Francisco" },
  { city: "Denver",       state: "Colorado",          state_abbr: "CO", label: "ICE HSI Denver" },
  { city: "Seattle",      state: "Washington",        state_abbr: "WA", label: "ICE HSI Seattle" },
  { city: "Boston",       state: "Massachusetts",     state_abbr: "MA", label: "ICE HSI Boston" },
  { city: "Philadelphia", state: "Pennsylvania",      state_abbr: "PA", label: "ICE HSI Philadelphia" },
  { city: "Baltimore",    state: "Maryland",          state_abbr: "MD", label: "ICE HSI Baltimore" },
  { city: "Detroit",      state: "Michigan",          state_abbr: "MI", label: "ICE HSI Detroit" },
  { city: "Newark",       state: "New Jersey",        state_abbr: "NJ", label: "ICE ERO Newark" },
  { city: "New Orleans",  state: "Louisiana",         state_abbr: "LA", label: "ICE ERO New Orleans" },
  { city: "Chicago",      state: "Illinois",          state_abbr: "IL", label: "ICE ERO Chicago" },
  { city: "Los Angeles",  state: "California",        state_abbr: "CA", label: "ICE ERO Los Angeles" },
];

// CBP (Border Patrol sectors + field offices)
const CBP_OFFICES = [
  { city: "Washington",   state: "District of Columbia", state_abbr: "DC", label: "CBP Headquarters" },
  { city: "San Diego",    state: "California",        state_abbr: "CA", label: "CBP San Diego Sector" },
  { city: "El Centro",    state: "California",        state_abbr: "CA", label: "CBP El Centro Sector" },
  { city: "Yuma",         state: "Arizona",           state_abbr: "AZ", label: "CBP Yuma Sector" },
  { city: "Tucson",       state: "Arizona",           state_abbr: "AZ", label: "CBP Tucson Sector" },
  { city: "El Paso",      state: "Texas",             state_abbr: "TX", label: "CBP El Paso Sector" },
  { city: "Big Bend",     state: "Texas",             state_abbr: "TX", label: "CBP Big Bend Sector" },
  { city: "Del Rio",      state: "Texas",             state_abbr: "TX", label: "CBP Del Rio Sector" },
  { city: "Laredo",       state: "Texas",             state_abbr: "TX", label: "CBP Laredo Sector" },
  { city: "Rio Grande City", state: "Texas",          state_abbr: "TX", label: "CBP Rio Grande Valley Sector" },
  { city: "McAllen",      state: "Texas",             state_abbr: "TX", label: "CBP McAllen Field Office" },
  { city: "New Orleans",  state: "Louisiana",         state_abbr: "LA", label: "CBP New Orleans Field Office" },
  { city: "Miami",        state: "Florida",           state_abbr: "FL", label: "CBP Miami Field Office" },
  { city: "Tampa",        state: "Florida",           state_abbr: "FL", label: "CBP Tampa Field Office" },
  { city: "Atlanta",      state: "Georgia",           state_abbr: "GA", label: "CBP Atlanta Field Office" },
  { city: "Baltimore",    state: "Maryland",          state_abbr: "MD", label: "CBP Baltimore Field Office" },
  { city: "Boston",       state: "Massachusetts",     state_abbr: "MA", label: "CBP Boston Field Office" },
  { city: "Buffalo",      state: "New York",          state_abbr: "NY", label: "CBP Buffalo Field Office" },
  { city: "Chicago",      state: "Illinois",          state_abbr: "IL", label: "CBP Chicago Field Office" },
  { city: "Detroit",      state: "Michigan",          state_abbr: "MI", label: "CBP Detroit Field Office" },
  { city: "Houston",      state: "Texas",             state_abbr: "TX", label: "CBP Houston Field Office" },
  { city: "Los Angeles",  state: "California",        state_abbr: "CA", label: "CBP Los Angeles Field Office" },
  { city: "New York",     state: "New York",          state_abbr: "NY", label: "CBP New York Field Office" },
  { city: "Portland",     state: "Oregon",            state_abbr: "OR", label: "CBP Portland Field Office" },
  { city: "San Francisco",state: "California",        state_abbr: "CA", label: "CBP San Francisco Field Office" },
  { city: "Seattle",      state: "Washington",        state_abbr: "WA", label: "CBP Seattle Field Office" },
  { city: "Blaine",       state: "Washington",        state_abbr: "WA", label: "CBP Blaine Sector" },
  { city: "Swanton",      state: "Vermont",           state_abbr: "VT", label: "CBP Swanton Sector" },
  { city: "Houlton",      state: "Maine",             state_abbr: "ME", label: "CBP Houlton Sector" },
  { city: "Detroit",      state: "Michigan",          state_abbr: "MI", label: "CBP Detroit Sector" },
  { city: "Grand Forks",  state: "North Dakota",      state_abbr: "ND", label: "CBP Grand Forks Sector" },
  { city: "Havre",        state: "Montana",           state_abbr: "MT", label: "CBP Havre Sector" },
  { city: "Spokane",      state: "Washington",        state_abbr: "WA", label: "CBP Spokane Sector" },
];

// Other federal agencies (HQ + national presence)
const OTHER_FEDERAL = [
  // US Marshals Service
  { name: "US Marshals Service Headquarters",              city: "Arlington",    state: "Virginia",              state_abbr: "VA", discipline: "fbi" },
  { name: "US Marshals Service — Eastern NY",              city: "New York",     state: "New York",              state_abbr: "NY", discipline: "fbi" },
  { name: "US Marshals Service — Southern Florida",        city: "Miami",        state: "Florida",               state_abbr: "FL", discipline: "fbi" },
  { name: "US Marshals Service — Central California",      city: "Los Angeles",  state: "California",            state_abbr: "CA", discipline: "fbi" },
  { name: "US Marshals Service — Northern Illinois",       city: "Chicago",      state: "Illinois",              state_abbr: "IL", discipline: "fbi" },
  { name: "US Marshals Service — Southern Texas",          city: "Houston",      state: "Texas",                 state_abbr: "TX", discipline: "fbi" },
  // US Secret Service
  { name: "US Secret Service Headquarters",                city: "Washington",   state: "District of Columbia",  state_abbr: "DC", discipline: "dhs" },
  { name: "US Secret Service — New York Field Office",     city: "New York",     state: "New York",              state_abbr: "NY", discipline: "dhs" },
  { name: "US Secret Service — Los Angeles Field Office",  city: "Los Angeles",  state: "California",            state_abbr: "CA", discipline: "dhs" },
  { name: "US Secret Service — Miami Field Office",        city: "Miami",        state: "Florida",               state_abbr: "FL", discipline: "dhs" },
  { name: "US Secret Service — Chicago Field Office",      city: "Chicago",      state: "Illinois",              state_abbr: "IL", discipline: "dhs" },
  // TSA
  { name: "TSA Headquarters",                              city: "Springfield",  state: "Virginia",              state_abbr: "VA", discipline: "dhs" },
  { name: "TSA Federal Security Director — LAX",           city: "Los Angeles",  state: "California",            state_abbr: "CA", discipline: "dhs" },
  { name: "TSA Federal Security Director — JFK",           city: "New York",     state: "New York",              state_abbr: "NY", discipline: "dhs" },
  { name: "TSA Federal Security Director — ORD",           city: "Chicago",      state: "Illinois",              state_abbr: "IL", discipline: "dhs" },
  { name: "TSA Federal Security Director — DFW",           city: "Dallas",       state: "Texas",                 state_abbr: "TX", discipline: "dhs" },
  { name: "TSA Federal Security Director — MIA",           city: "Miami",        state: "Florida",               state_abbr: "FL", discipline: "dhs" },
  // US Coast Guard
  { name: "US Coast Guard Headquarters",                   city: "Washington",   state: "District of Columbia",  state_abbr: "DC", discipline: "dhs" },
  { name: "Coast Guard District 1 — Boston",               city: "Boston",       state: "Massachusetts",         state_abbr: "MA", discipline: "dhs" },
  { name: "Coast Guard District 5 — Portsmouth",           city: "Portsmouth",   state: "Virginia",              state_abbr: "VA", discipline: "dhs" },
  { name: "Coast Guard District 7 — Miami",                city: "Miami",        state: "Florida",               state_abbr: "FL", discipline: "dhs" },
  { name: "Coast Guard District 8 — New Orleans",          city: "New Orleans",  state: "Louisiana",             state_abbr: "LA", discipline: "dhs" },
  { name: "Coast Guard District 9 — Cleveland",            city: "Cleveland",    state: "Ohio",                  state_abbr: "OH", discipline: "dhs" },
  { name: "Coast Guard District 11 — Alameda",             city: "Alameda",      state: "California",            state_abbr: "CA", discipline: "dhs" },
  { name: "Coast Guard District 13 — Seattle",             city: "Seattle",      state: "Washington",            state_abbr: "WA", discipline: "dhs" },
  { name: "Coast Guard District 14 — Honolulu",            city: "Honolulu",     state: "Hawaii",                state_abbr: "HI", discipline: "dhs" },
  { name: "Coast Guard District 17 — Juneau",              city: "Juneau",       state: "Alaska",                state_abbr: "AK", discipline: "dhs" },
  // Capitol Police / Other
  { name: "US Capitol Police",                             city: "Washington",   state: "District of Columbia",  state_abbr: "DC", discipline: "police" },
  { name: "US Park Police",                                city: "Washington",   state: "District of Columbia",  state_abbr: "DC", discipline: "police" },
  { name: "Pentagon Force Protection Agency",              city: "Arlington",    state: "Virginia",              state_abbr: "VA", discipline: "police" },
  { name: "Amtrak Police Department",                      city: "Philadelphia", state: "Pennsylvania",          state_abbr: "PA", discipline: "police" },
  { name: "National Park Service — Law Enforcement",       city: "Washington",   state: "District of Columbia",  state_abbr: "DC", discipline: "police" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  MutualAid — Federal Agencies Seeder ");
  console.log("═══════════════════════════════════════\n");

  const { data: existing } = await supabase.from("agencies").select("slug");
  const slugSeen = new Set((existing || []).map(r => r.slug));
  console.log(`Existing agencies in DB: ${slugSeen.size}\n`);

  const rows = [];

  // FBI (discipline: fbi)
  for (const o of FBI_OFFICES) {
    rows.push({
      name: o.label,
      slug: makeUniqueSlug(slugify(o.label), slugSeen),
      discipline: "fbi",
      city: o.city, state: o.state, state_abbr: o.state_abbr,
      verified: false,
    });
  }

  // ATF (discipline: fbi — DOJ bureau)
  for (const o of ATF_OFFICES) {
    rows.push({
      name: o.label,
      slug: makeUniqueSlug(slugify(o.label), slugSeen),
      discipline: "fbi",
      city: o.city, state: o.state, state_abbr: o.state_abbr,
      verified: false,
    });
  }

  // DEA (discipline: fbi — DOJ bureau)
  for (const o of DEA_OFFICES) {
    rows.push({
      name: o.label,
      slug: makeUniqueSlug(slugify(o.label), slugSeen),
      discipline: "fbi",
      city: o.city, state: o.state, state_abbr: o.state_abbr,
      verified: false,
    });
  }

  // ICE (discipline: dhs)
  for (const o of ICE_OFFICES) {
    rows.push({
      name: o.label,
      slug: makeUniqueSlug(slugify(o.label), slugSeen),
      discipline: "dhs",
      city: o.city, state: o.state, state_abbr: o.state_abbr,
      verified: false,
    });
  }

  // CBP (discipline: dhs)
  for (const o of CBP_OFFICES) {
    rows.push({
      name: o.label,
      slug: makeUniqueSlug(slugify(o.label), slugSeen),
      discipline: "dhs",
      city: o.city, state: o.state, state_abbr: o.state_abbr,
      verified: false,
    });
  }

  // Others
  for (const o of OTHER_FEDERAL) {
    rows.push({
      name: o.name,
      slug: makeUniqueSlug(slugify(o.name), slugSeen),
      discipline: o.discipline,
      city: o.city, state: o.state, state_abbr: o.state_abbr,
      verified: false,
    });
  }

  console.log(`Total federal records to seed: ${rows.length}\n`);
  console.log(`  FBI field offices: ${FBI_OFFICES.length}`);
  console.log(`  ATF field divisions: ${ATF_OFFICES.length}`);
  console.log(`  DEA field divisions: ${DEA_OFFICES.length}`);
  console.log(`  ICE offices: ${ICE_OFFICES.length}`);
  console.log(`  CBP offices/sectors: ${CBP_OFFICES.length}`);
  console.log(`  USMS/USSS/TSA/USCG/Other: ${OTHER_FEDERAL.length}\n`);

  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    await upsertBatch(rows.slice(i, i + BATCH));
    inserted += Math.min(BATCH, rows.length - i);
    process.stdout.write(`\r  Inserted: ${inserted}/${rows.length}`);
  }

  console.log("\n\n═══════════════════════════════════════");
  console.log(`✅ Federal agencies seeded: ${inserted}`);
  console.log("   Filter in the app: Federal tab (shows FBI + DHS disciplines)");
  console.log("═══════════════════════════════════════");
}

main().catch(err => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
