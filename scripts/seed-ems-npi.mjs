/**
 * Seeds EMS / ambulance agencies from the CMS NPPES NPI Registry.
 *
 * Every ambulance organization that bills Medicare/insurance has an NPI
 * (taxonomy "Ambulance" — land/air/water). Free public API, no key.
 *
 * API caps each query at 1,200 records (limit 200 × skip ≤ 1000), so we
 * page per state and, when a state hits the cap, re-slice the query by
 * organization-name prefix (A*–Z*, 0*–9*).
 *
 * Dedupes by NPI and by (name, city, state) — orgs often hold several NPIs.
 * Idempotent: upserts on slug, ignores duplicates.
 *
 * Usage: node scripts/seed-ems-npi.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

function loadEnv() {
  const raw = readFileSync("/Users/giancarloceci/Desktop/mutualaid/.env.local", "utf-8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const [k, ...v] = t.split("=");
    process.env[k.trim()] = v.join("=").trim();
  }
}
loadEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const API = "https://npiregistry.cms.hhs.gov/api/";
const PAGE = 200;
const MAX_SKIP = 1000;
const CAP = PAGE + MAX_SKIP; // 1,200 — API ceiling per query combo

const STATE_NAMES = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",
  DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",
  MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",
  NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",
  ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",
  SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia",
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 200);
}
function makeUniqueSlug(base, seen) {
  let slug = base, n = 2;
  while (seen.has(slug)) slug = `${base}-${n++}`;
  seen.add(slug);
  return slug;
}
function titleCase(s) {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bEms\b/g, "EMS").replace(/\bLlc\b/g, "LLC").replace(/\bInc\b/g, "Inc")
    .replace(/\bIi\b/g, "II").replace(/\bIii\b/g, "III").replace(/\bUsa\b/g, "USA")
    .replace(/\bAmr\b/g, "AMR").replace(/\bDba\b/g, "dba");
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiQuery(params) {
  const url = `${API}?${new URLSearchParams({ version: "2.1", enumeration_type: "NPI-2", taxonomy_description: "Ambulance", limit: String(PAGE), ...params })}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.Errors) throw new Error(JSON.stringify(json.Errors));
      return json.results ?? [];
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(1500 * attempt);
    }
  }
}

// Fetch every page for one query combo; returns results (may hit CAP)
async function fetchAllPages(params) {
  const all = [];
  for (let skip = 0; skip <= MAX_SKIP; skip += PAGE) {
    const batch = await apiQuery({ ...params, skip: String(skip) });
    all.push(...batch);
    await sleep(120);
    if (batch.length < PAGE) break;
  }
  return all;
}

// ── Load existing slugs ───────────────────────────────────────────
const slugSeen = new Set();
{
  let from = 0;
  for (;;) {
    const { data } = await supabase.from("agencies").select("slug").range(from, from + 999);
    if (!data || data.length === 0) break;
    data.forEach((r) => slugSeen.add(r.slug));
    if (data.length < 1000) break;
    from += 1000;
  }
}
console.log(`Loaded ${slugSeen.size.toLocaleString()} existing slugs\n`);

async function upsertBatch(rows) {
  const { error } = await supabase.from("agencies").upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
  if (error) throw error;
}

// ── Crawl state by state ──────────────────────────────────────────
// API wildcards need ≥2 leading chars, so capped states are re-sliced
// by two-digit ZIP prefix (00*–99*) — each slice gets its own 1,200 cap.
const POSTAL_SLICES = Array.from({ length: 100 }, (_, i) => `${String(i).padStart(2, "0")}*`);
const npiSeen = new Set();
const orgSeen = new Set(); // name|city|state dedupe across multiple NPIs
let totalInserted = 0;

// Optional state filter for resuming: node seed-ems-npi.mjs OH OK OR ...
const stateFilter = process.argv.slice(2).map((s) => s.toUpperCase());
const statesToRun = Object.entries(STATE_NAMES).filter(
  ([abbr]) => stateFilter.length === 0 || stateFilter.includes(abbr)
);

for (const [abbr, stateName] of statesToRun) {
  let results = await fetchAllPages({ state: abbr });

  // Hit the API ceiling → re-crawl sliced by ZIP prefix
  if (results.length >= CAP) {
    results = [];
    for (const prefix of POSTAL_SLICES) {
      const sliced = await fetchAllPages({ state: abbr, postal_code: prefix });
      results.push(...sliced);
    }
  }

  const rows = [];
  for (const r of results) {
    const npi = r.number;
    if (!npi || npiSeen.has(npi)) continue;
    npiSeen.add(npi);

    const rawName = r.basic?.organization_name;
    if (!rawName) continue;
    const loc = r.addresses?.find((a) => a.address_purpose === "LOCATION") ?? r.addresses?.[0];
    const city = loc?.city ? titleCase(loc.city.trim()) : "";

    const orgKey = `${rawName.toUpperCase()}|${city.toUpperCase()}|${abbr}`;
    if (orgSeen.has(orgKey)) continue; // same org, different NPI
    orgSeen.add(orgKey);

    const name = titleCase(rawName.trim());
    const slug = makeUniqueSlug(slugify(`${name}-${abbr}`), slugSeen);
    rows.push({
      name, slug, discipline: "ems",
      city, state: stateName, state_abbr: abbr,
      county: null, website: null, verified: false,
    });
  }

  for (let i = 0; i < rows.length; i += 500) {
    await upsertBatch(rows.slice(i, i + 500));
  }
  totalInserted += rows.length;
  console.log(`  ${abbr}: +${rows.length} (raw ${results.length})  — total ${totalInserted.toLocaleString()}`);
}

console.log(`\n✅ EMS agencies seeded: ${totalInserted.toLocaleString()}`);
