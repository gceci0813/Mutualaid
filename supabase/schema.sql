-- ============================================================
-- MutualAid — Supabase Schema
-- Run this in your Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for text search

-- ============================================================
-- AGENCIES
-- ============================================================
create type discipline_type as enum (
  'police', 'fire', 'ems', 'dispatch', 'dpw',
  'fbi', 'dhs', 'corrections', 'other'
);

create table agencies (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  discipline    discipline_type not null,
  city          text not null,
  state         text not null,
  state_abbr    char(2) not null,
  county        text,
  website       text,
  employee_count integer,
  verified      boolean default false,
  -- computed/cached
  avg_overall   numeric(3,2),
  review_count  integer default 0,
  open_job_count integer default 0,
  created_at    timestamptz default now()
);

create index agencies_name_idx   on agencies using gin(name gin_trgm_ops);
create index agencies_state_idx  on agencies (state_abbr);
create index agencies_disc_idx   on agencies (discipline);

-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================
create table user_profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  anonymous_alias   text not null unique,
  discipline        discipline_type,
  agency_id         uuid references agencies(id),
  is_department_rep boolean default false,
  created_at        timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into user_profiles (id, anonymous_alias)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'anonymous_alias', 'User' || substring(new.id::text, 1, 6))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- REVIEWS
-- ============================================================
create table reviews (
  id                  uuid primary key default uuid_generate_v4(),
  agency_id           uuid not null references agencies(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  anonymous_alias     text not null,
  title               text not null check (length(title) <= 120),
  body                text not null check (length(body) >= 50),
  pros                text,
  cons                text,
  -- ratings 1–5
  rating_overall      smallint not null check (rating_overall between 1 and 5),
  rating_culture      smallint check (rating_culture between 1 and 5),
  rating_leadership   smallint check (rating_leadership between 1 and 5),
  rating_worklife     smallint check (rating_worklife between 1 and 5),
  rating_pay          smallint check (rating_pay between 1 and 5),
  rating_equipment    smallint check (rating_equipment between 1 and 5),
  rating_advancement  smallint check (rating_advancement between 1 and 5),
  rating_family       smallint check (rating_family between 1 and 5),
  employment_status   text not null check (employment_status in ('active', 'former', 'volunteer')),
  years_experience    smallint,
  recommend           boolean not null,
  upvotes             integer default 0,
  -- one review per user per agency
  unique (agency_id, user_id),
  created_at          timestamptz default now()
);

create index reviews_agency_idx on reviews (agency_id);

-- Update agency stats after review insert/delete
create or replace function update_agency_stats()
returns trigger language plpgsql security definer as $$
begin
  update agencies
  set
    review_count = (select count(*) from reviews where agency_id = coalesce(new.agency_id, old.agency_id)),
    avg_overall  = (select round(avg(rating_overall)::numeric, 2) from reviews where agency_id = coalesce(new.agency_id, old.agency_id))
  where id = coalesce(new.agency_id, old.agency_id);
  return coalesce(new, old);
end;
$$;

create trigger review_stats_trigger
  after insert or update or delete on reviews
  for each row execute function update_agency_stats();

-- ============================================================
-- FORUM THREADS
-- ============================================================
create type thread_category as enum (
  'general', 'salary', 'culture', 'equipment',
  'training', 'mental_health', 'family_life', 'news', 'advice'
);

create table threads (
  id                uuid primary key default uuid_generate_v4(),
  agency_id         uuid references agencies(id),  -- optional: department-specific
  user_id           uuid not null references auth.users(id) on delete cascade,
  anonymous_alias   text not null,
  title             text not null check (length(title) <= 150),
  body              text not null check (length(body) >= 20),
  category          thread_category not null default 'general',
  discipline_filter discipline_type,
  upvotes           integer default 0,
  comment_count     integer default 0,
  pinned            boolean default false,
  created_at        timestamptz default now()
);

create index threads_category_idx on threads (category);
create index threads_created_idx  on threads (created_at desc);
create index threads_agency_idx   on threads (agency_id);

-- ============================================================
-- COMMENTS
-- ============================================================
create table comments (
  id              uuid primary key default uuid_generate_v4(),
  thread_id       uuid not null references threads(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  anonymous_alias text not null,
  body            text not null check (length(body) >= 2),
  parent_id       uuid references comments(id),
  upvotes         integer default 0,
  created_at      timestamptz default now()
);

create index comments_thread_idx on comments (thread_id);

-- Update thread comment_count
create or replace function update_comment_count()
returns trigger language plpgsql security definer as $$
begin
  update threads
  set comment_count = (
    select count(*) from comments
    where thread_id = coalesce(new.thread_id, old.thread_id)
  )
  where id = coalesce(new.thread_id, old.thread_id);
  return coalesce(new, old);
end;
$$;

create trigger comment_count_trigger
  after insert or delete on comments
  for each row execute function update_comment_count();

-- ============================================================
-- VOTES (upvotes for reviews, threads, comments)
-- ============================================================
create table votes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('review', 'thread', 'comment')),
  target_id   uuid not null,
  unique (user_id, target_type, target_id),
  created_at  timestamptz default now()
);

-- ============================================================
-- JOBS
-- ============================================================
create table jobs (
  id                  uuid primary key default uuid_generate_v4(),
  agency_id           uuid not null references agencies(id) on delete cascade,
  posted_by_user_id   uuid not null references auth.users(id),
  title               text not null,
  description         text not null check (length(description) >= 100),
  requirements        text,
  benefits            text,
  discipline          discipline_type not null,
  employment_type     text not null check (employment_type in ('full_time', 'part_time', 'volunteer', 'per_diem')),
  salary_min          numeric(10, 2),
  salary_max          numeric(10, 2),
  salary_type         text not null default 'annual' check (salary_type in ('hourly', 'annual')),
  external_apply_url  text,
  deadline            date,
  active              boolean default true,
  created_at          timestamptz default now()
);

create index jobs_agency_idx    on jobs (agency_id);
create index jobs_discipline_idx on jobs (discipline);
create index jobs_active_idx    on jobs (active, created_at desc);

-- Update agency open_job_count
create or replace function update_job_count()
returns trigger language plpgsql security definer as $$
begin
  update agencies
  set open_job_count = (
    select count(*) from jobs
    where agency_id = coalesce(new.agency_id, old.agency_id)
    and active = true
  )
  where id = coalesce(new.agency_id, old.agency_id);
  return coalesce(new, old);
end;
$$;

create trigger job_count_trigger
  after insert or update or delete on jobs
  for each row execute function update_job_count();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table agencies       enable row level security;
alter table user_profiles  enable row level security;
alter table reviews        enable row level security;
alter table threads        enable row level security;
alter table comments       enable row level security;
alter table votes          enable row level security;
alter table jobs           enable row level security;

-- AGENCIES: public read, no public write
create policy "agencies_public_read"  on agencies for select using (true);

-- USER PROFILES: users see their own profile only
create policy "profiles_own_select"   on user_profiles for select using (auth.uid() = id);
create policy "profiles_own_update"   on user_profiles for update using (auth.uid() = id);

-- REVIEWS: public read, authenticated write (own only)
create policy "reviews_public_read"   on reviews for select using (true);
create policy "reviews_auth_insert"   on reviews for insert with check (auth.uid() = user_id);
create policy "reviews_own_update"    on reviews for update using (auth.uid() = user_id);
create policy "reviews_own_delete"    on reviews for delete using (auth.uid() = user_id);

-- THREADS: public read, authenticated write
create policy "threads_public_read"   on threads for select using (true);
create policy "threads_auth_insert"   on threads for insert with check (auth.uid() = user_id);
create policy "threads_own_update"    on threads for update using (auth.uid() = user_id);
create policy "threads_own_delete"    on threads for delete using (auth.uid() = user_id);

-- COMMENTS: public read, authenticated write
create policy "comments_public_read"  on comments for select using (true);
create policy "comments_auth_insert"  on comments for insert with check (auth.uid() = user_id);
create policy "comments_own_update"   on comments for update using (auth.uid() = user_id);
create policy "comments_own_delete"   on comments for delete using (auth.uid() = user_id);

-- VOTES: authenticated only
create policy "votes_auth_select"     on votes for select using (auth.uid() = user_id);
create policy "votes_auth_insert"     on votes for insert with check (auth.uid() = user_id);
create policy "votes_own_delete"      on votes for delete using (auth.uid() = user_id);

-- JOBS: public read, authenticated insert
create policy "jobs_public_read"      on jobs for select using (true);
create policy "jobs_auth_insert"      on jobs for insert with check (auth.uid() = posted_by_user_id);
create policy "jobs_own_update"       on jobs for update using (auth.uid() = posted_by_user_id);
create policy "jobs_own_delete"       on jobs for delete using (auth.uid() = posted_by_user_id);

-- ============================================================
-- NOTE: Seed agency data from:
--   Fire:  USFA National Fire Department Registry (CSV download)
--   Police: FBI UCR Law Enforcement Agency list
--   EMS:   State EMS registries (varies by state)
-- Import with: supabase db push or a seed script
-- ============================================================
