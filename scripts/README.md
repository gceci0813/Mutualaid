# MutualAid — Database Seed Scripts

## Quick Start

### 1. Set up environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Settings > API > service_role
FBI_API_KEY=your-fbi-key                          # Free at https://api.data.gov/signup/
```

> **Important:** Use the `service_role` key (not `anon`) for seeding — it bypasses RLS.

### 2. Run the Supabase schema

In your Supabase project, go to **SQL Editor** and run:
```
supabase/schema.sql
```

### 3. Test data sources

```bash
node scripts/test-sources.mjs
```

This verifies USFA and FBI API access without touching your database.

### 4. Seed the database

```bash
node scripts/seed-agencies.mjs
```

Expected output: ~27,000 fire depts + ~18,000 law enforcement agencies.

---

## Data Sources

| Discipline | Source | Records | Access |
|-----------|--------|---------|--------|
| 🚒 Fire | [USFA National Fire Dept Registry](https://apps.usfa.fema.gov/registry/download) | ~27,000 | Free, no auth |
| 👮 Police | [FBI Crime Data Explorer API](https://api.usa.gov/crime/fbi/cde) | ~18,000 | Free API key from [api.data.gov](https://api.data.gov/signup/) |
| 🚑 EMS | [NEMSIS](https://nemsis.org/using-ems-data/request-research-data/) | ~13,000 | Data use agreement required |

## Getting a Free FBI API Key

1. Go to **https://api.data.gov/signup/**
2. Enter your name and email
3. Key is emailed instantly
4. Add to `.env.local` as `FBI_API_KEY=your-key-here`

With your own key: no rate limits. With `DEMO_KEY`: 30 requests/hour.

## Re-running the seeder

The seeder is idempotent — it uses `upsert` with `slug` as the conflict key.
Running it again will update existing records and add new ones without duplication.

## Adding EMS Agencies

NEMSIS requires a data use agreement. Once approved:
1. Download their agency CSV
2. Adapt the `seedFireDepts` function in `seed-agencies.mjs` for EMS format
3. Set `discipline: "ems"` for those rows
