-- ============================================================
-- Migration 004: Optional salary data on reviews
-- Builds the proprietary pay dataset (levels.fyi-style moat).
-- Run in Supabase SQL Editor after 003
-- ============================================================

alter table reviews
  add column if not exists salary_amount numeric check (salary_amount is null or salary_amount > 0),
  add column if not exists salary_period text
    check (salary_period is null or salary_period in ('hourly', 'annual'));

-- Salary aggregation queries filter by agency + discipline
create index if not exists reviews_salary_idx
  on reviews (agency_id)
  where salary_amount is not null;
