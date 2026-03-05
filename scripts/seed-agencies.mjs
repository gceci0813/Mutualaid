/**
 * MutualAid — Agency Seed Script
 *
 * Pulls agency data from two public government sources and seeds
 * the Supabase `agencies` table.
 *
 * Sources:
 *   1. USFA National Fire Department Registry (27k fire depts, free CSV)
 *   2. FBI Crime Data Explorer API (18k+ law enforcement agencies, free key)
 *
 * Usage:
 *   node scripts/seed-agencies.mjs
 *
 * Required env vars (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← get from Supabase > Settings > API
 *   FBI_API_KEY                 ← get free at https://api.data.gov/signup/
 *                                  (use "DEMO_KEY" for testing, 30 req/hour)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load env ────────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = path.join(__dirname, "..", ".env.local");
    const raw = readFileSync(envPath, "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      process.env[key.trim()] = rest.join("=").trim();
    }
  } catch {
    console.log("No .env.local found — using existing environment variables.");
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FBI_API_KEY = process.env.FBI_API_KEY || "DEMO_KEY";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
    "Add them to .env.local (use the service_role key, not anon key)."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 200);
}

function makeUniqueSlug(base, seen) {
  let slug = base;
  let n = 2;
  while (seen.has(slug)) slug = `${base}-${n++}`;
  seen.add(slug);
  return slug;
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "MutualAid-Seeder/1.0" } }, (res) => {
      if (res.statusCode === 429) return reject(new Error("Rate limited (429). Use your own FBI_API_KEY."));
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message} — Raw: ${data.slice(0, 200)}`)); }
      });
    }).on("error", reject);
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function upsertBatch(rows) {
  const { error } = await supabase
    .from("agencies")
    .upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
  if (error) throw error;
}

// ── USFA Fire Department Data ─────────────────────────────────────────────────
const USFA_URL =
  "https://apps.usfa.fema.gov/registry/api/download/national";

async function downloadUSFA(csvPath) {
  console.log("⬇  Downloading USFA fire department registry...");
  return new Promise((resolve, reject) => {
    const file = createWriteStream(csvPath);
    https.get(USFA_URL, { headers: { "User-Agent": "MutualAid-Seeder/1.0" } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`USFA HTTP ${res.statusCode}`));
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", reject);
  });
}

/**
 * Parse the USFA CSV using Python's csv module (more tolerant of malformed quotes).
 * Returns parsed records as a JS array.
 */
async function parseUSFAWithPython(csvPath) {
  const { execSync } = await import("child_process");
  const jsonPath = csvPath.replace(".csv", ".json");
  execSync(
    `python3 -c "
import csv, json
records = []
with open('${csvPath}', newline='', encoding='utf-8', errors='replace') as f:
    reader = csv.DictReader(f)
    reader.fieldnames = [n.strip() for n in reader.fieldnames]
    for row in reader:
        records.append({k.strip(): v.strip() for k, v in row.items()})
with open('${jsonPath}', 'w') as out:
    json.dump(records, out)
"`,
    { stdio: "inherit" }
  );
  return JSON.parse(readFileSync(jsonPath, "utf-8"));
}

const STATE_ABBR_MAP = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA",
  Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
  Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX",
  Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC",
};

const STATE_NAMES = Object.fromEntries(Object.entries(STATE_ABBR_MAP).map(([k, v]) => [v, k]));

async function seedFireDepts(slugSeen) {
  const csvPath = "/tmp/mutualaid_usfa.csv";

  try { await downloadUSFA(csvPath); }
  catch (err) {
    console.warn("  ⚠  Could not download USFA data:", err.message);
    console.warn("  ℹ  Download manually from https://apps.usfa.fema.gov/registry/download");
    console.warn("     and place at /tmp/mutualaid_usfa.csv, then re-run.");
    return 0;
  }

  // Parse via Python — its csv module handles the malformed quotes in USFA data
  console.log("   Parsing CSV (via Python for tolerance of malformed address quotes)...");
  const records = await parseUSFAWithPython(csvPath);

  console.log(`   Parsed ${records.length} fire departments from USFA.`);

  const BATCH = 200;
  let inserted = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const rows = [];

    for (const r of batch) {
      const name = r["Fire dept name"]?.trim();
      const city = r["HQ city"]?.trim();
      const stateAbbr = r["HQ state"]?.trim().toUpperCase();
      if (!name || !city || !stateAbbr || stateAbbr.length !== 2) continue;

      const stateName = STATE_NAMES[stateAbbr] || stateAbbr;
      const baseSlug = slugify(`${name}-${city}-${stateAbbr}`);
      const slug = makeUniqueSlug(baseSlug, slugSeen);

      // Career > 0 → career; mix → combination; all volunteer → volunteer
      const career = parseInt(r["Active Firefighters - Career"] || "0");
      const volunteer = parseInt(r["Active Firefighters - Volunteer"] || "0");
      const deptType = career > 0 && volunteer > 0 ? "fire" : "fire";

      rows.push({
        name,
        slug,
        discipline: "fire",
        city,
        state: stateName,
        state_abbr: stateAbbr,
        county: r["County"]?.trim() || null,
        website: r["Website"]?.trim() || null,
        employee_count: career + volunteer + parseInt(r["Active Firefighters - Paid per Call"] || "0") || null,
        verified: false,
      });
    }

    if (rows.length > 0) {
      await upsertBatch(rows);
      inserted += rows.length;
    }

    if ((i / BATCH) % 10 === 0)
      process.stdout.write(`\r   Fire: ${inserted}/${records.length}`);
  }

  console.log(`\n✅ Fire departments seeded: ${inserted}`);
  return inserted;
}

// ── FBI CDE Law Enforcement Data ─────────────────────────────────────────────
const US_STATES_LIST = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
  "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const AGENCY_TYPE_MAP = {
  "City": "police",
  "County": "police",
  "University or College": "police",
  "State Police": "police",
  "Tribal": "police",
  "Federal": "fbi",
  "Other State Agency": "police",
  "Special Jurisdiction": "police",
  "Military": "police",
  "Sheriff": "police",
};

async function seedLawEnforcement(slugSeen) {
  console.log(`\n⬇  Fetching FBI CDE law enforcement agencies (API key: ${FBI_API_KEY === "DEMO_KEY" ? "DEMO_KEY [30 req/hr limit]" : "custom"})...`);
  if (FBI_API_KEY === "DEMO_KEY") {
    console.log("   ⚠  Using DEMO_KEY — rate limited to 30 req/hour. Get a free key at https://api.data.gov/signup/\n" +
                "      Set FBI_API_KEY in .env.local for full speed.");
  }

  let total = 0;

  for (const stateAbbr of US_STATES_LIST) {
    const url = `https://api.usa.gov/crime/fbi/cde/agency/byStateAbbr/${stateAbbr}?API_KEY=${FBI_API_KEY}`;
    let data;
    try {
      data = await fetchJSON(url);
    } catch (err) {
      console.warn(`  ⚠  ${stateAbbr}: ${err.message}`);
      if (err.message.includes("Rate limited")) break;
      await sleep(2000);
      continue;
    }

    const rows = [];
    const agencies = Object.values(data).flat();

    for (const agency of agencies) {
      const name = agency.agency_name?.trim();
      if (!name) continue;

      const discipline = AGENCY_TYPE_MAP[agency.agency_type_name] || "police";
      const stateName = STATE_NAMES[stateAbbr] || stateAbbr;
      const city = agency.counties || ""; // FBI API doesn't return city, use county
      const baseSlug = slugify(`${name}-${stateAbbr}`);
      const slug = makeUniqueSlug(baseSlug, slugSeen);

      rows.push({
        name,
        slug,
        discipline,
        city: city,
        state: stateName,
        state_abbr: stateAbbr,
        county: agency.counties || null,
        website: null,
        verified: false,
      });
    }

    if (rows.length > 0) {
      await upsertBatch(rows);
      total += rows.length;
    }

    process.stdout.write(`\r   Police: ${total} agencies | ${stateAbbr} (${agencies.length})   `);

    // Respect rate limits: ~500ms between requests for DEMO_KEY
    await sleep(FBI_API_KEY === "DEMO_KEY" ? 500 : 100);
  }

  console.log(`\n✅ Law enforcement agencies seeded: ${total}`);
  return total;
}

// ── EMS Placeholder ──────────────────────────────────────────────────────────
async function seedEMSPlaceholder(slugSeen) {
  // NOTE: There is no single free national EMS agency registry.
  // NEMSIS (nemsis.org) requires a data use agreement for bulk download.
  // Options:
  //   A. Request NEMSIS data: https://nemsis.org/using-ems-data/request-research-data/
  //   B. Import state EMS agency lists individually (most states publish them)
  //   C. Use the NHTSA EMS Office state contacts: https://www.ems.gov/
  //
  // When you have EMS CSV data, add it here in the same format as fire.
  console.log("\nℹ  EMS agencies: no automated source available.");
  console.log("   → Request data from NEMSIS: https://nemsis.org/using-ems-data/request-research-data/");
  console.log("   → Or find your state EMS registry: https://www.ems.gov/");
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  MutualAid — Agency Database Seeder  ");
  console.log("═══════════════════════════════════════\n");

  // Track slugs to prevent duplicates
  const slugSeen = new Set();

  // Load existing slugs from DB to avoid conflicts on re-run
  console.log("📋 Loading existing slugs from database...");
  const { data: existing } = await supabase.from("agencies").select("slug");
  (existing || []).forEach((r) => slugSeen.add(r.slug));
  console.log(`   Found ${slugSeen.size} existing agencies.\n`);

  const fireCount = await seedFireDepts(slugSeen);
  const policeCount = await seedLawEnforcement(slugSeen);
  await seedEMSPlaceholder(slugSeen);

  console.log("\n═══════════════════════════════════════");
  console.log(`🎉 Done!  Fire: ${fireCount} | Police: ${policeCount}`);
  console.log("   Total agencies in database:", slugSeen.size);
  console.log("═══════════════════════════════════════");
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
