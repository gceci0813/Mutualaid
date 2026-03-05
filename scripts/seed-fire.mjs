/**
 * Seeds only USFA fire departments. CSV already downloaded to /tmp/mutualaid_usfa.csv
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const raw = readFileSync("/Users/giancarloceci/Desktop/mutualaid/.env.local", "utf-8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const [k, ...v] = t.split("=");
      process.env[k.trim()] = v.join("=").trim();
    }
  } catch { console.log("No .env.local"); }
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

const STATE_ABBR_MAP = {
  Alabama:"AL",Alaska:"AK",Arizona:"AZ",Arkansas:"AR",California:"CA",Colorado:"CO",Connecticut:"CT",
  Delaware:"DE",Florida:"FL",Georgia:"GA",Hawaii:"HI",Idaho:"ID",Illinois:"IL",Indiana:"IN",Iowa:"IA",
  Kansas:"KS",Kentucky:"KY",Louisiana:"LA",Maine:"ME",Maryland:"MD",Massachusetts:"MA",Michigan:"MI",
  Minnesota:"MN",Mississippi:"MS",Missouri:"MO",Montana:"MT",Nebraska:"NE",Nevada:"NV",
  "New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC",
  "North Dakota":"ND",Ohio:"OH",Oklahoma:"OK",Oregon:"OR",Pennsylvania:"PA","Rhode Island":"RI",
  "South Carolina":"SC","South Dakota":"SD",Tennessee:"TN",Texas:"TX",Utah:"UT",Vermont:"VT",
  Virginia:"VA",Washington:"WA","West Virginia":"WV",Wisconsin:"WI",Wyoming:"WY","District of Columbia":"DC",
};
const STATE_NAMES = Object.fromEntries(Object.entries(STATE_ABBR_MAP).map(([k,v]) => [v,k]));

const csvPath = "/tmp/mutualaid_usfa.csv";
const jsonPath = "/tmp/mutualaid_usfa.json";

console.log("Parsing CSV via Python...");
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
print(f'  Parsed {len(records):,} fire departments')
"`,
  { stdio: "inherit" }
);

const records = JSON.parse(readFileSync(jsonPath, "utf-8"));
console.log(`Loaded ${records.length} fire departments\n`);

// Load existing slugs (includes police agencies already seeded)
const { data: existing } = await supabase.from("agencies").select("slug");
const slugSeen = new Set((existing || []).map(r => r.slug));
console.log(`Loaded ${slugSeen.size} existing slugs`);

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
    const slug = makeUniqueSlug(slugify(`${name}-${city}-${stateAbbr}`), slugSeen);
    const career = parseInt(r["Active Firefighters - Career"] || "0");
    const volunteer = parseInt(r["Active Firefighters - Volunteer"] || "0");
    rows.push({
      name, slug, discipline: "fire", city, state: stateName, state_abbr: stateAbbr,
      county: r["County"]?.trim() || null,
      website: r["Website"]?.trim() || null,
      employee_count: career + volunteer + parseInt(r["Active Firefighters - Paid per Call"] || "0") || null,
      verified: false,
    });
  }
  if (rows.length > 0) { await upsertBatch(rows); inserted += rows.length; }
  process.stdout.write(`\r  Fire: ${inserted}/${records.length}`);
}

console.log(`\n\n✅ Fire departments seeded: ${inserted}`);
console.log(`Total agencies in DB: ${slugSeen.size}`);
