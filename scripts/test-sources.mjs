/**
 * Quick test to verify data sources work before running the full seed.
 * Does NOT write to Supabase.
 * Run: node scripts/test-sources.mjs
 */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import https from "https";
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
  } catch { /* no .env.local */ }
}
loadEnv();

const FBI_API_KEY = process.env.FBI_API_KEY || "DEMO_KEY";

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "MutualAid-Test/1.0" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Bad JSON from ${url}: ${data.slice(0, 100)}`)); }
      });
    }).on("error", reject);
  });
}

// ── 1. USFA Fire Data ─────────────────────────────────────────────────────────
console.log("=== Test 1: USFA Fire Department Registry ===");
const csvPath = "/tmp/mutualaid_usfa.csv";
const jsonPath = "/tmp/mutualaid_usfa.json";

if (!existsSync(csvPath)) {
  console.log("Downloading USFA CSV...");
  execSync(
    `curl -sL --max-time 60 "https://apps.usfa.fema.gov/registry/api/download/national" -o "${csvPath}"`,
    { stdio: "inherit" }
  );
}

console.log("Parsing with Python...");
execSync(
  `python3 << 'PYEOF'
import csv, json
records = []
with open('${csvPath}', newline='', encoding='utf-8', errors='replace') as f:
    reader = csv.DictReader(f)
    reader.fieldnames = [n.strip() for n in reader.fieldnames]
    for row in reader:
        records.append({k.strip(): v.strip() for k, v in row.items()})
with open('${jsonPath}', 'w') as out:
    json.dump(records, out)
print(f"  ✅ Parsed {len(records):,} fire departments")
print(f"  Sample: {records[5]['Fire dept name']} — {records[5]['HQ city']}, {records[5]['HQ state']}")
PYEOF`,
  { stdio: "inherit" }
);

// ── 2. FBI CDE Law Enforcement ───────────────────────────────────────────────
console.log("\n=== Test 2: FBI Crime Data Explorer API ===");
console.log(`Using API key: ${FBI_API_KEY}`);

try {
  const data = await fetchJSON(
    `https://api.usa.gov/crime/fbi/cde/agency/byStateAbbr/VT?API_KEY=${FBI_API_KEY}`
  );
  if (data.error) {
    console.log("  ❌ FBI API error:", data.error.message);
    if (FBI_API_KEY === "DEMO_KEY") {
      console.log("  ℹ  DEMO_KEY is rate-limited (30 req/hr).");
      console.log("  → Get a free key at https://api.data.gov/signup/");
      console.log("  → Add FBI_API_KEY=your-key to .env.local");
    }
  } else {
    const agencies = Object.values(data).flat();
    console.log(`  ✅ FBI CDE: ${agencies.length} agencies in VT`);
    console.log(`  Sample: ${agencies[0]?.agency_name} (${agencies[0]?.agency_type_name})`);
  }
} catch (err) {
  console.log("  ❌ FBI API error:", err.message);
}

console.log("\n=== Results ===");
const records = JSON.parse(readFileSync(jsonPath, "utf-8"));
console.log(`✅ Fire departments ready: ${records.length.toLocaleString()}`);
console.log(`ℹ  Police agencies: requires FBI API key (free at https://api.data.gov/signup/)`);
console.log(`ℹ  EMS agencies: request from NEMSIS (https://nemsis.org/using-ems-data/request-research-data/)`);
console.log("\nReady to seed! Run: node scripts/seed-agencies.mjs");
