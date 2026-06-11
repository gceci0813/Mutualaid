-- ============================================================
-- Migration 003: Content reporting / moderation queue
-- Run in Supabase SQL Editor after 002
-- ============================================================

create table if not exists content_reports (
  id           uuid primary key default uuid_generate_v4(),
  content_type text not null check (content_type in ('review', 'thread', 'comment')),
  content_id   uuid not null,
  reported_by  uuid not null references auth.users(id) on delete cascade,
  reason       text not null check (reason in (
    'doxxing', 'harassment', 'spam', 'false_info', 'inappropriate', 'other'
  )),
  details      text,
  status       text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at   timestamptz default now(),
  resolved_at  timestamptz,
  -- one report per user per piece of content
  unique (content_type, content_id, reported_by)
);

create index if not exists reports_status_idx on content_reports (status, created_at desc);

-- RLS: all access goes through service-role API routes.
-- Reporters submit via POST /api/reports; admins review via /api/admin/reports.
alter table content_reports enable row level security;
