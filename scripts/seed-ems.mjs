/**
 * MutualAid — EMS Agency Seed Script
 *
 * Sources:
 *   1. USFA National Fire Dept Registry (same CSV as fire seed) — filters for
 *      departments with EMS as a primary or additional service.
 *   2. Falls back to a curated list of major metro EMS agencies.
 *
 * Usage:
 *   node scripts/seed-ems.mjs
 *
 * Required env vars (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Note: The USFA CSV from apps.usfa.fema.gov/registry/api/download/national
 *   includes a "Primary Type" or "Organization Type" column indicating EMS
 *   departments. This script extracts those automatically.
 *   Download it first with seed-agencies.mjs or seed-fire.mjs, or place it at
 *   /tmp/mutualaid_usfa.csv manually.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, createWriteStream } from "fs";
import { execSync } from "child_process";
import { pipeline } from "stream/promises";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envPath = path.join(__dirname, "..", ".env.local");
    const raw = readFileSync(envPath, "utf-8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const [k, ...v] = t.split("=");
      process.env[k.trim()] = v.join("=").trim();
    }
  } catch { console.log("No .env.local found — using existing env vars."); }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 200);
}
function makeUniqueSlug(base, seen) {
  let slug = base, n = 2;
  while (seen.has(slug)) slug = `${base}-${n++}`;
  seen.add(slug);
  return slug;
}
async function upsertBatch(rows) {
  const { error } = await supabase.from("agencies").upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
  if (error) throw error;
}

const STATE_ABBR_MAP = {
  Alabama:"AL",Alaska:"AK",Arizona:"AZ",Arkansas:"AR",California:"CA",Colorado:"CO",
  Connecticut:"CT",Delaware:"DE",Florida:"FL",Georgia:"GA",Hawaii:"HI",Idaho:"ID",
  Illinois:"IL",Indiana:"IN",Iowa:"IA",Kansas:"KS",Kentucky:"KY",Louisiana:"LA",
  Maine:"ME",Maryland:"MD",Massachusetts:"MA",Michigan:"MI",Minnesota:"MN",
  Mississippi:"MS",Missouri:"MO",Montana:"MT",Nebraska:"NE",Nevada:"NV",
  "New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY",
  "North Carolina":"NC","North Dakota":"ND",Ohio:"OH",Oklahoma:"OK",Oregon:"OR",
  Pennsylvania:"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD",
  Tennessee:"TN",Texas:"TX",Utah:"UT",Vermont:"VT",Virginia:"VA",Washington:"WA",
  "West Virginia":"WV",Wisconsin:"WI",Wyoming:"WY","District of Columbia":"DC",
};
const STATE_NAMES = Object.fromEntries(Object.entries(STATE_ABBR_MAP).map(([k,v]) => [v,k]));

const USFA_URL = "https://apps.usfa.fema.gov/registry/api/download/national";
const CSV_PATH = "/tmp/mutualaid_usfa.csv";
const JSON_PATH = "/tmp/mutualaid_usfa_ems.json";

async function downloadUSFA() {
  console.log("⬇  Downloading USFA fire/EMS registry CSV...");
  return new Promise((resolve, reject) => {
    const file = createWriteStream(CSV_PATH);
    https.get(USFA_URL, { headers: { "User-Agent": "MutualAid-Seeder/1.0" } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`USFA HTTP ${res.statusCode}`));
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", reject);
  });
}

async function parseCSV() {
  execSync(
    `python3 -c "
import csv, json
records = []
with open('${CSV_PATH}', newline='', encoding='utf-8', errors='replace') as f:
    reader = csv.DictReader(f)
    reader.fieldnames = [n.strip() for n in reader.fieldnames]
    for row in reader:
        records.append({k.strip(): v.strip() for k, v in row.items()})
with open('${JSON_PATH}', 'w') as out:
    json.dump(records, out)
print(f'  Parsed {len(records):,} records')
print('  Columns:', list(records[0].keys())[:20] if records else [])
"`,
    { stdio: "inherit" }
  );
  return JSON.parse(readFileSync(JSON_PATH, "utf-8"));
}

// Keywords that indicate a department provides EMS
const EMS_KEYWORDS = ["ems", "ambulance", "medic", "paramedic", "rescue"];
function isEMSName(name) {
  const lower = name.toLowerCase();
  return EMS_KEYWORDS.some(kw => lower.includes(kw));
}

// USFA column names that indicate EMS service (varies by CSV version)
const EMS_COLUMN_KEYWORDS = ["ems", "ambulance", "emergency medical", "primary type"];

async function seedFromUSFA(slugSeen) {
  if (!existsSync(CSV_PATH)) {
    try { await downloadUSFA(); }
    catch (err) {
      console.warn("  ⚠  Could not download USFA CSV:", err.message);
      return 0;
    }
  } else {
    console.log("   Using existing CSV at", CSV_PATH);
  }

  const records = await parseCSV();
  console.log(`\n   Total records: ${records.length.toLocaleString()}`);

  if (records.length === 0) return 0;

  // Find which columns might indicate EMS
  const columns = Object.keys(records[0]);
  const emsColumns = columns.filter(c =>
    EMS_COLUMN_KEYWORDS.some(kw => c.toLowerCase().includes(kw))
  );
  console.log("   EMS-related columns found:", emsColumns.length > 0 ? emsColumns : "(none)");

  let inserted = 0;
  const BATCH = 200;
  const rows = [];

  for (const r of records) {
    const name = r["Fire dept name"]?.trim();
    const city = r["HQ city"]?.trim();
    const stateAbbr = r["HQ state"]?.trim().toUpperCase();
    if (!name || !city || !stateAbbr || stateAbbr.length !== 2) continue;

    // Check if this record indicates EMS service
    let isEMS = false;

    // Check EMS-related columns for "yes", "y", "1", or the word "ems"
    for (const col of emsColumns) {
      const val = (r[col] || "").toLowerCase();
      if (val === "yes" || val === "y" || val === "1" || val.includes("ems") ||
          val.includes("ambulance") || val.includes("emergency medical")) {
        isEMS = true;
        break;
      }
    }

    // Also catch departments that have EMS in their name
    if (!isEMS && isEMSName(name)) isEMS = true;

    // Primary type field (if present)
    const primaryType = (r["Primary Type"] || r["Organization Type"] || "").toLowerCase();
    if (primaryType.includes("ems") || primaryType === "ems only" ||
        primaryType.includes("fire & ems") || primaryType.includes("fire and ems")) {
      isEMS = true;
    }

    if (!isEMS) continue;

    const stateName = STATE_NAMES[stateAbbr] || stateAbbr;
    const slug = makeUniqueSlug(slugify(`${name}-${city}-${stateAbbr}`), slugSeen);
    const career = parseInt(r["Active Firefighters - Career"] || "0");
    const volunteer = parseInt(r["Active Firefighters - Volunteer"] || "0");

    rows.push({
      name,
      slug,
      discipline: "ems",
      city,
      state: stateName,
      state_abbr: stateAbbr,
      county: r["County"]?.trim() || null,
      website: r["Website"]?.trim() || null,
      employee_count: career + volunteer + parseInt(r["Active Firefighters - Paid per Call"] || "0") || null,
      verified: false,
    });
  }

  console.log(`\n   EMS records identified from USFA data: ${rows.length.toLocaleString()}`);

  // Batch insert
  for (let i = 0; i < rows.length; i += BATCH) {
    await upsertBatch(rows.slice(i, i + BATCH));
    inserted += Math.min(BATCH, rows.length - i);
    process.stdout.write(`\r   EMS: ${inserted}/${rows.length}`);
  }

  return inserted;
}

// ── Fallback: major metro EMS agencies ───────────────────────────────────────
// Used when USFA CSV has no EMS column data
const MAJOR_EMS_AGENCIES = [
  // Fire-based EMS (fire departments that are primary EMS providers)
  { name: "Los Angeles County EMS Agency", city: "Los Angeles", state: "California", state_abbr: "CA", county: "Los Angeles" },
  { name: "New York City EMS", city: "New York", state: "New York", state_abbr: "NY", county: "New York" },
  { name: "Chicago Fire Department EMS", city: "Chicago", state: "Illinois", state_abbr: "IL", county: "Cook" },
  { name: "Houston Fire Department EMS", city: "Houston", state: "Texas", state_abbr: "TX", county: "Harris" },
  { name: "Philadelphia Fire Department EMS", city: "Philadelphia", state: "Pennsylvania", state_abbr: "PA", county: "Philadelphia" },
  { name: "Phoenix Fire Department EMS", city: "Phoenix", state: "Arizona", state_abbr: "AZ", county: "Maricopa" },
  { name: "San Antonio Fire Department EMS", city: "San Antonio", state: "Texas", state_abbr: "TX", county: "Bexar" },
  { name: "San Diego Fire-Rescue EMS", city: "San Diego", state: "California", state_abbr: "CA", county: "San Diego" },
  { name: "Dallas Fire-Rescue EMS", city: "Dallas", state: "Texas", state_abbr: "TX", county: "Dallas" },
  { name: "San Jose Fire Department EMS", city: "San Jose", state: "California", state_abbr: "CA", county: "Santa Clara" },
  // Third-service / county EMS
  { name: "Miami-Dade Fire Rescue EMS", city: "Miami", state: "Florida", state_abbr: "FL", county: "Miami-Dade" },
  { name: "Broward County EMS", city: "Fort Lauderdale", state: "Florida", state_abbr: "FL", county: "Broward" },
  { name: "King County Medic One", city: "Seattle", state: "Washington", state_abbr: "WA", county: "King" },
  { name: "Fairfax County Fire and Rescue EMS", city: "Fairfax", state: "Virginia", state_abbr: "VA", county: "Fairfax" },
  { name: "Montgomery County EMS", city: "Rockville", state: "Maryland", state_abbr: "MD", county: "Montgomery" },
  { name: "Denver Health Paramedics", city: "Denver", state: "Colorado", state_abbr: "CO", county: "Denver" },
  { name: "Boston EMS", city: "Boston", state: "Massachusetts", state_abbr: "MA", county: "Suffolk" },
  { name: "Nashville Fire Department EMS", city: "Nashville", state: "Tennessee", state_abbr: "TN", county: "Davidson" },
  { name: "Louisville Metro EMS", city: "Louisville", state: "Kentucky", state_abbr: "KY", county: "Jefferson" },
  { name: "Portland Fire & Rescue EMS", city: "Portland", state: "Oregon", state_abbr: "OR", county: "Multnomah" },
  { name: "Las Vegas Fire & Rescue EMS", city: "Las Vegas", state: "Nevada", state_abbr: "NV", county: "Clark" },
  { name: "Clark County Fire Department EMS", city: "Las Vegas", state: "Nevada", state_abbr: "NV", county: "Clark" },
  { name: "Memphis Fire Department EMS", city: "Memphis", state: "Tennessee", state_abbr: "TN", county: "Shelby" },
  { name: "Baltimore City Fire Department EMS", city: "Baltimore", state: "Maryland", state_abbr: "MD", county: "Baltimore City" },
  { name: "Columbus Division of Fire EMS", city: "Columbus", state: "Ohio", state_abbr: "OH", county: "Franklin" },
  { name: "Indianapolis Emergency Medical Services", city: "Indianapolis", state: "Indiana", state_abbr: "IN", county: "Marion" },
  { name: "Charlotte Fire Department EMS", city: "Charlotte", state: "North Carolina", state_abbr: "NC", county: "Mecklenburg" },
  { name: "Mecklenburg County EMS", city: "Charlotte", state: "North Carolina", state_abbr: "NC", county: "Mecklenburg" },
  { name: "Jacksonville Fire and Rescue EMS", city: "Jacksonville", state: "Florida", state_abbr: "FL", county: "Duval" },
  { name: "Austin-Travis County EMS", city: "Austin", state: "Texas", state_abbr: "TX", county: "Travis" },
  { name: "Fort Worth Fire Department EMS", city: "Fort Worth", state: "Texas", state_abbr: "TX", county: "Tarrant" },
  { name: "El Paso Fire Department EMS", city: "El Paso", state: "Texas", state_abbr: "TX", county: "El Paso" },
  { name: "Albuquerque Fire Rescue EMS", city: "Albuquerque", state: "New Mexico", state_abbr: "NM", county: "Bernalillo" },
  { name: "Sacramento Metro Fire EMS", city: "Sacramento", state: "California", state_abbr: "CA", county: "Sacramento" },
  { name: "Long Beach Fire Department EMS", city: "Long Beach", state: "California", state_abbr: "CA", county: "Los Angeles" },
  { name: "Fresno Fire Department EMS", city: "Fresno", state: "California", state_abbr: "CA", county: "Fresno" },
  { name: "Oakland Fire Department EMS", city: "Oakland", state: "California", state_abbr: "CA", county: "Alameda" },
  { name: "Tucson Fire Department EMS", city: "Tucson", state: "Arizona", state_abbr: "AZ", county: "Pima" },
  { name: "Atlanta Fire Rescue EMS", city: "Atlanta", state: "Georgia", state_abbr: "GA", county: "Fulton" },
  { name: "Fulton County EMS", city: "Atlanta", state: "Georgia", state_abbr: "GA", county: "Fulton" },
  { name: "New Orleans EMS", city: "New Orleans", state: "Louisiana", state_abbr: "LA", county: "Orleans" },
  { name: "Omaha Fire Department EMS", city: "Omaha", state: "Nebraska", state_abbr: "NE", county: "Douglas" },
  { name: "Raleigh Wake Emergency Medical Services", city: "Raleigh", state: "North Carolina", state_abbr: "NC", county: "Wake" },
  { name: "Virginia Beach Fire Department EMS", city: "Virginia Beach", state: "Virginia", state_abbr: "VA", county: "Virginia Beach" },
  { name: "Colorado Springs Fire Department EMS", city: "Colorado Springs", state: "Colorado", state_abbr: "CO", county: "El Paso" },
  { name: "Wichita Fire Department EMS", city: "Wichita", state: "Kansas", state_abbr: "KS", county: "Sedgwick" },
  { name: "Tampa Fire Rescue EMS", city: "Tampa", state: "Florida", state_abbr: "FL", county: "Hillsborough" },
  { name: "Hillsborough County Fire Rescue EMS", city: "Tampa", state: "Florida", state_abbr: "FL", county: "Hillsborough" },
  { name: "Arlington Fire Department EMS", city: "Arlington", state: "Texas", state_abbr: "TX", county: "Tarrant" },
  { name: "Aurora Fire Rescue EMS", city: "Aurora", state: "Colorado", state_abbr: "CO", county: "Arapahoe" },
  { name: "Anaheim Fire & Rescue EMS", city: "Anaheim", state: "California", state_abbr: "CA", county: "Orange" },
  // Rural / volunteer EMS
  { name: "Hocking Hills Emergency Medical Services", city: "Logan", state: "Ohio", state_abbr: "OH", county: "Hocking" },
  { name: "Appalachian Emergency Medical Services", city: "Bluefield", state: "West Virginia", state_abbr: "WV", county: "Mercer" },
  { name: "Frontier County EMS", city: "Curtis", state: "Nebraska", state_abbr: "NE", county: "Frontier" },
];

async function seedFallbackEMS(slugSeen) {
  console.log("\n📋 Seeding major metro EMS agencies as fallback...");
  const rows = MAJOR_EMS_AGENCIES.map(a => ({
    name: a.name,
    slug: makeUniqueSlug(slugify(`${a.name}-${a.city}-${a.state_abbr}`), slugSeen),
    discipline: "ems",
    city: a.city,
    state: a.state,
    state_abbr: a.state_abbr,
    county: a.county || null,
    verified: false,
  }));

  for (let i = 0; i < rows.length; i += 50) {
    await upsertBatch(rows.slice(i, i + 50));
  }

  return rows.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  MutualAid — EMS Agency Seeder       ");
  console.log("═══════════════════════════════════════\n");

  // Load existing slugs
  const { data: existing } = await supabase.from("agencies").select("slug");
  const slugSeen = new Set((existing || []).map(r => r.slug));
  console.log(`Existing agencies in DB: ${slugSeen.size}\n`);

  // Check current EMS count
  const { count: emsCount } = await supabase
    .from("agencies").select("id", { count: "exact", head: true }).eq("discipline", "ems");
  console.log(`Current EMS agencies: ${emsCount ?? 0}\n`);

  let inserted = await seedFromUSFA(slugSeen);

  if (inserted === 0) {
    console.log("\n   USFA CSV had no EMS column data — seeding curated fallback list.");
    inserted = await seedFallbackEMS(slugSeen);
  }

  console.log("\n\n═══════════════════════════════════════");
  console.log(`✅ EMS agencies seeded: ${inserted}`);
  console.log("═══════════════════════════════════════");
}

main().catch(err => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
