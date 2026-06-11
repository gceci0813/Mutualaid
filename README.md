# MutualAid

**The anonymous review and community platform for first responders.**

Police, fire, EMS, dispatch, and public safety professionals review their agencies, discuss the job, and find their next department — completely anonymously. Think Glassdoor × Blind, built for the people who run toward the danger.

Live at **[mutualaid-seven.vercel.app](https://mutualaid-seven.vercel.app)**

---

## Features

| Area | What it does |
|---|---|
| **Anonymous reviews** | 8-category ratings (culture, leadership, pay, equipment…) across 66,000+ indexed US agencies, with optional officer-reported salary data |
| **Agency responses** | Claimed agencies post one official public reply per review |
| **Community forum** | Nationwide + per-agency discussion boards, threaded comments, upvotes, in-app notifications |
| **Job board** | Department-posted listings with salary ranges; $99 featured placement |
| **Salary intelligence** | Pay ranges by discipline from job listings + anonymous officer reports; satisfaction scores from reviews |
| **Rankings** | SEO landing pages: best agencies nationwide, by discipline, and by discipline + state |
| **Compare** | Side-by-side agency comparison across all rating categories |
| **Moderation** | User reporting on all content, admin review queue with remove/dismiss |
| **Monetization** | Stripe: individual Premium ($4.99/mo), agency Basic ($99/mo) / Pro ($249/mo), featured jobs ($99 one-time) |

### Anonymity design

- Posts display a randomly generated alias — never a name, never an email
- `.gov` email verification keeps only the **domain**; the address is deleted after verification
- Optional seed-phrase accounts: no email at all
- Row-level security on every table; notifications created only by DB triggers

## Stack

- **Next.js 16** (App Router, React Server Components, Turbopack)
- **Supabase** — Postgres, Auth, RLS
- **Stripe** — subscriptions + one-time payments via Checkout & webhooks
- **Tailwind CSS** — custom design system
- **Vercel** — hosting, analytics, OG image generation

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase + Stripe keys
npm run dev
```

### Database setup

Run `supabase/schema.sql` in the Supabase SQL editor, then each file in `supabase/migrations/` in numeric order (001 → 005). Migrations are idempotent.

### Environment variables

See [.env.local.example](.env.local.example) for the full annotated list:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS` — comma-separated admin accounts (moderation queue, verification codes)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_*` — payments (the app runs fine without them; checkout returns a friendly "not configured" message)

## Project structure

```
app/
  agencies/[slug]/        agency profile + reviews, forum, jobs tabs, claim flow
  api/                    Stripe checkout/webhook, reports, upvotes, verification
  dashboard/              user dashboard, agency dashboard, admin (codes + reports)
  forum/                  nationwide board, thread pages, composer
  jobs/                   board, detail pages, posting + featured checkout
  rankings/               SEO ranking pages (nationwide / discipline / state)
  salary/  compare/  search/   intelligence tools
components/               shared UI (Navbar, NotificationBell, ReportButton…)
lib/                      supabase clients, stripe, utils
supabase/                 schema.sql + numbered migrations
```
