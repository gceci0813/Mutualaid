-- ============================================================
-- Migration 002: Stripe billing columns + atomic upvote RPCs
-- Run in Supabase SQL Editor after 001
-- ============================================================

-- Stripe customer references for subscription management
alter table user_profiles
  add column if not exists stripe_customer_id text;

alter table agency_claims
  add column if not exists stripe_customer_id text;

-- ============================================================
-- Atomic upvote increments (avoids read-then-write races)
-- Called by /api/threads/[id]/upvote and /api/comments/[id]/upvote
-- ============================================================
create or replace function increment_thread_upvotes(thread_id uuid)
returns integer
language sql
security definer
as $$
  update threads
  set upvotes = upvotes + 1
  where id = thread_id
  returning upvotes;
$$;

create or replace function increment_comment_upvotes(comment_id uuid)
returns integer
language sql
security definer
as $$
  update comments
  set upvotes = upvotes + 1
  where id = comment_id
  returning upvotes;
$$;

-- Only authenticated users may call these
revoke execute on function increment_thread_upvotes(uuid) from public, anon;
revoke execute on function increment_comment_upvotes(uuid) from public, anon;
grant execute on function increment_thread_upvotes(uuid) to authenticated;
grant execute on function increment_comment_upvotes(uuid) to authenticated;
