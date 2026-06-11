/**
 * Seeds correctional facilities from the HIFLD Prison Boundaries dataset
 * (centroids mirror on ArcGIS Hub, ~6,700 facilities; we take STATUS=OPEN).
 *
 * Fetches directly from the ArcGIS feature service — no manual download.
 * Idempotent: upserts on slug, ignores duplicates.
 *
 * Usage: node scripts/seed-corrections.mjs
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

const SERVICE = "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Centroids_for_Prison_Boundaries/FeatureServer/0/query";

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 200);
}
function makeUniqueSlug(base, seen) {
  let slug = base, n = 2;
  while (seen.has(slug)) slug = `${base}-${n++}`;
  seen.add(slug);
  return slug;
}
// HIFLD names are ALL CAPS — title-case for display
function titleCase(s) {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bUsp\b/g, "USP").replace(/\bFci\b/g, "FCI").replace(/\bFdc\b/g, "FDC")
    .replace(/\bMcc\b/g, "MCC").replace(/\bFmc\b/g, "FMC").replace(/\bIi\b/g, "II")
    .replace(/\bIii\b/g, "III").replace(/\bIv\b/g, "IV");
}
async function upsertBatch(rows) {
  const { error } = await supabase.from("agencies").upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
  if (error) throw error;
}

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

// ── Fetch all OPEN facilities, paged ──────────────────────────────
console.log("Fetching HIFLD prison facilities (STATUS=OPEN)...");
const facilities = [];
let offset = 0;
for (;;) {
  const params = new URLSearchParams({
    f: "json",
    where: "STATUS = 'OPEN'",
    outFields: "NAME,CITY,STATE,COUNTY,TYPE,WEBSITE",
    returnGeometry: "false",
    resultOffset: String(offset),
    resultRecordCount: "2000",
    orderByFields: "OBJECTID",
  });
  const json = await (await fetch(`${SERVICE}?${params}`)).json();
  if (json.error) throw new Error(JSON.stringify(json.error));
  const batch = json.features ?? [];
  facilities.push(...batch.map((f) => f.attributes));
  console.log(`  fetched ${facilities.length}`);
  if (batch.length < 2000) break;
  offset += 2000;
}

// ── Load existing slugs ───────────────────────────────────────────
const slugSeen = new Set();
let from = 0;
for (;;) {
  const { data } = await supabase.from("agencies").select("slug").range(from, from + 999);
  if (!data || data.length === 0) break;
  data.forEach((r) => slugSeen.add(r.slug));
  if (data.length < 1000) break;
  from += 1000;
}
console.log(`Loaded ${slugSeen.size.toLocaleString()} existing slugs`);

// ── Build + upsert ────────────────────────────────────────────────
let inserted = 0, skipped = 0;
let rows = [];

for (const fac of facilities) {
  const stateAbbr = fac.STATE;
  const stateName = STATE_NAMES[stateAbbr];
  if (!stateName || !fac.NAME) { skipped++; continue; }

  const name = titleCase(fac.NAME);
  const city = fac.CITY ? titleCase(fac.CITY) : "";
  const website = fac.WEBSITE && fac.WEBSITE !== "NOT AVAILABLE" ? fac.WEBSITE : null;
  const slug = makeUniqueSlug(slugify(`${name}-${stateAbbr}`), slugSeen);

  rows.push({
    name, slug, discipline: "corrections",
    city, state: stateName, state_abbr: stateAbbr,
    county: fac.COUNTY ? titleCase(fac.COUNTY) : null,
    website,
    verified: false,
  });

  if (rows.length >= 500) {
    await upsertBatch(rows);
    inserted += rows.length;
    rows = [];
    process.stdout.write(`\r  Corrections: ${inserted.toLocaleString()}`);
  }
}
if (rows.length > 0) { await upsertBatch(rows); inserted += rows.length; }

console.log(`\n\n✅ Correctional facilities seeded: ${inserted.toLocaleString()} (skipped ${skipped})`);
