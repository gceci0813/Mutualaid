/**
 * Seeds 911 dispatch centers (PSAPs) from the FCC Master PSAP Registry.
 *
 * Source: https://www.fcc.gov/general/9-1-1-master-psap-registry
 * Download the CSV to /tmp/mutualaid_psap.csv first:
 *   curl -A "Mozilla/5.0" -o /tmp/mutualaid_psap.csv \
 *     https://www.fcc.gov/sites/default/files/masterpsapregistryv2.297.csv
 *
 * Excludes type "O" (orphaned — no longer a primary call-taking point)
 * and US territories. Idempotent: upserts on slug, ignores duplicates.
 *
 * Usage: node scripts/seed-dispatch.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

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

const csvPath = "/tmp/mutualaid_psap.csv";
const jsonPath = "/tmp/mutualaid_psap.json";
if (!existsSync(csvPath)) {
  console.error(`❌ ${csvPath} not found — download it first (see header comment).`);
  process.exit(1);
}

console.log("Parsing FCC PSAP registry CSV via Python...");
execSync(
  `python3 -c "
import csv, json
rows = list(csv.reader(open('${csvPath}', errors='replace')))
hdr_i = next(i for i, r in enumerate(rows) if r and r[0].strip() == 'PSAP ID')
hdr = [h.strip() for h in rows[hdr_i]]
records = []
for r in rows[hdr_i + 1:]:
    if len(r) < 6 or not r[1].strip():
        continue
    records.append({hdr[j]: (r[j].strip() if j < len(r) else '') for j in range(8)})
json.dump(records, open('${jsonPath}', 'w'))
print(f'  Parsed {len(records):,} PSAP rows')
"`,
  { stdio: "inherit" }
);

const records = JSON.parse(readFileSync(jsonPath, "utf-8"));

// Load existing slugs across the whole agencies table
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

let inserted = 0, skippedOrphan = 0, skippedTerritory = 0;
let rows = [];

for (const r of records) {
  const change = (r["Type of Change"] ?? "").toUpperCase();
  if (change.includes("O")) { skippedOrphan++; continue; } // orphaned PSAP

  const stateAbbr = r["State"];
  const stateName = STATE_NAMES[stateAbbr];
  if (!stateName) { skippedTerritory++; continue; }

  const name = r["PSAP Name"];
  const city = r["City"] || r["County"] || "";
  const slug = makeUniqueSlug(slugify(`${name}-${stateAbbr}`), slugSeen);

  rows.push({
    name, slug, discipline: "dispatch",
    city, state: stateName, state_abbr: stateAbbr,
    county: r["County"] || null,
    website: null,
    verified: false,
  });

  if (rows.length >= 500) {
    await upsertBatch(rows);
    inserted += rows.length;
    rows = [];
    process.stdout.write(`\r  Dispatch: ${inserted.toLocaleString()}`);
  }
}
if (rows.length > 0) { await upsertBatch(rows); inserted += rows.length; }

console.log(`\n\n✅ Dispatch centers seeded: ${inserted.toLocaleString()}`);
console.log(`   Skipped: ${skippedOrphan} orphaned, ${skippedTerritory} territories`);
