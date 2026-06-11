-- ============================================================
-- Migration 005: In-app notifications
-- Created by DB triggers (tamper-proof — no client API can
-- forge a notification for another user).
-- Run in Supabase SQL Editor after 004
-- ============================================================

create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null check (type in ('thread_comment', 'comment_reply', 'agency_response')),
  title      text not null,
  body       text,
  link       text not null,
  read       boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_idx
  on notifications (user_id, read, created_at desc);

alter table notifications enable row level security;
create policy "notifications_own_read"   on notifications for select using (auth.uid() = user_id);
create policy "notifications_own_update" on notifications for update using (auth.uid() = user_id);
create policy "notifications_own_delete" on notifications for delete using (auth.uid() = user_id);
-- No insert policy: rows are created only by the security-definer triggers below.

-- ============================================================
-- Trigger: new comment → notify thread author (+ parent comment
-- author on replies). Never notifies the commenter themselves.
-- ============================================================
create or replace function notify_on_comment() returns trigger
language plpgsql security definer as $$
declare
  t_author uuid;
  parent_author uuid;
begin
  select user_id into t_author from threads where id = new.thread_id;

  if t_author is not null and t_author <> new.user_id then
    insert into notifications (user_id, type, title, body, link)
    values (
      t_author,
      'thread_comment',
      new.anonymous_alias || ' commented on your thread',
      left(new.body, 140),
      '/forum/' || new.thread_id
    );
  end if;

  if new.parent_id is not null then
    select user_id into parent_author from comments where id = new.parent_id;
    if parent_author is not null
       and parent_author <> new.user_id
       and (t_author is null or parent_author <> t_author) then
      insert into notifications (user_id, type, title, body, link)
      values (
        parent_author,
        'comment_reply',
        new.anonymous_alias || ' replied to your comment',
        left(new.body, 140),
        '/forum/' || new.thread_id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists comments_notify on comments;
create trigger comments_notify
  after insert on comments
  for each row execute function notify_on_comment();

-- ============================================================
-- Trigger: official agency response → notify the review author.
-- Fires on first response only (edits are upserts, not inserts).
-- ============================================================
create or replace function notify_on_review_response() returns trigger
language plpgsql security definer as $$
declare
  r_author uuid;
  a_slug text;
  a_name text;
begin
  select r.user_id, a.slug, a.name into r_author, a_slug, a_name
  from reviews r
  join agencies a on a.id = r.agency_id
  where r.id = new.review_id;

  if r_author is not null then
    insert into notifications (user_id, type, title, body, link)
    values (
      r_author,
      'agency_response',
      a_name || ' responded to your review',
      left(new.body, 140),
      '/agencies/' || a_slug
    );
  end if;

  return new;
end;
$$;

drop trigger if exists review_responses_notify on review_responses;
create trigger review_responses_notify
  after insert on review_responses
  for each row execute function notify_on_review_response();
