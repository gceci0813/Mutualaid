-- ============================================================
-- Migration 001: Email domain verification + monetization
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

-- ============================================================
-- USER PROFILES: new columns
-- ============================================================
alter table user_profiles
  add column if not exists verified_domain       text,
  add column if not exists subscription_tier     text not null default 'free'
    check (subscription_tier in ('free', 'premium')),
  add column if not exists subscription_expires_at timestamptz;

-- ============================================================
-- EMAIL VERIFICATION TOKENS
-- Temporary OTP storage — only domain is retained after confirm,
-- the work email address itself is NEVER stored.
-- ============================================================
create table if not exists email_verification_tokens (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  domain     text not null,
  otp_hash   text not null,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz default now(),
  unique (user_id)  -- one pending token per user at a time
);

-- RLS: managed exclusively via service-role API routes
alter table email_verification_tokens enable row level security;

-- ============================================================
-- AGENCY CLAIMS
-- Departments/agencies claim their profile to get analytics +
-- ability to respond to reviews (employer tier).
-- ============================================================
create table if not exists agency_claims (
  id           uuid primary key default uuid_generate_v4(),
  agency_id    uuid not null unique references agencies(id) on delete cascade,
  claimed_by   uuid not null references auth.users(id),
  plan         text not null default 'basic' check (plan in ('basic', 'pro')),
  active       boolean not null default false,
  contact_name text not null,
  contact_email text not null,
  created_at   timestamptz default now()
);

alter table agency_claims enable row level security;
create policy "claims_own_read"   on agency_claims for select using (auth.uid() = claimed_by);
create policy "claims_own_insert" on agency_claims for insert with check (auth.uid() = claimed_by);

-- Add claimed flag to agencies for quick lookup
alter table agencies
  add column if not exists is_claimed boolean default false;

-- ============================================================
-- REVIEW RESPONSES
-- Claimed agencies can post one official response per review.
-- ============================================================
create table if not exists review_responses (
  id         uuid primary key default uuid_generate_v4(),
  review_id  uuid not null unique references reviews(id) on delete cascade,
  agency_id  uuid not null references agencies(id),
  body       text not null check (length(body) >= 10),
  created_at timestamptz default now()
);

alter table review_responses enable row level security;
create policy "responses_public_read" on review_responses for select using (true);
-- Inserts managed via service-role API (we validate the claimer server-side)

-- ============================================================
-- JOBS: featured listings columns
-- ============================================================
alter table jobs
  add column if not exists is_featured    boolean not null default false,
  add column if not exists featured_until timestamptz;

-- Index so featured jobs sort to top quickly
create index if not exists jobs_featured_idx on jobs (is_featured, created_at desc);

-- ============================================================
-- UPDATED RLS: gate review/thread/comment inserts behind
-- is_verified_officer = true on user_profiles
-- ============================================================

-- Drop old permissive insert policies
drop policy if exists "reviews_auth_insert"  on reviews;
drop policy if exists "threads_auth_insert"  on threads;
drop policy if exists "comments_auth_insert" on comments;

-- Re-create with verification gate
create policy "reviews_verified_insert" on reviews
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from user_profiles
      where id = auth.uid()
      and is_verified_officer = true
    )
  );

create policy "threads_verified_insert" on threads
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from user_profiles
      where id = auth.uid()
      and is_verified_officer = true
    )
  );

create policy "comments_verified_insert" on comments
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from user_profiles
      where id = auth.uid()
      and is_verified_officer = true
    )
  );
