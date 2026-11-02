-- Phase 3: the Inbox. Comments, replies, mentions and DMs from every channel, read every 10 minutes by `inbox`
-- jobs (one channel each). Items are written only by the server (service role); members read their workspace's.

create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  channel_id uuid not null references public.channels on delete cascade,
  kind text not null check (kind in ('comment', 'reply', 'mention', 'dm')),
  -- The network's id for this item, its thread (top-level comment or DM conversation) and what it answers.
  network_id text not null,
  thread_id text not null,
  parent_id text,
  -- The post it belongs to: ours when we published it, and the network's id and link either way.
  target_id uuid references public.post_targets on delete set null,
  post_remote_id text,
  post_url text,
  post_text text,
  url text,
  author_id text,
  author_name text not null default '',
  author_handle text,
  author_avatar text,
  text text not null default '',
  created_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  -- Written by the channel itself: a reply sent from here or on the network. Always done.
  mine boolean not null default false,
  status text not null default 'open' check (status in ('open', 'done')),
  liked boolean not null default false,
  like_ref text,
  hidden boolean not null default false,
  reply_text text,
  replied_at timestamptz,
  replied_by uuid references auth.users on delete set null,
  -- What a reply, like or hide needs later (a Bluesky cid, a LinkedIn object urn, a Mastodon visibility).
  extra jsonb not null default '{}',
  unique (channel_id, network_id)
);
create index if not exists inbox_items_list on public.inbox_items (workspace_id, created_at desc) where not mine;
create index if not exists inbox_items_open on public.inbox_items (workspace_id) where status = 'open' and not mine;
create index if not exists inbox_items_thread on public.inbox_items (channel_id, thread_id);
alter table public.inbox_items enable row level security;
create policy read_inbox_items on public.inbox_items for select to authenticated using (public.is_member(workspace_id));
grant select on public.inbox_items to authenticated;
grant all on public.inbox_items to service_role;

-- Where each channel's last read stopped (the network's own cursor), when it ran, and why it stopped if it did.
create table if not exists public.inbox_state (
  channel_id uuid primary key references public.channels on delete cascade,
  cursor text,
  fetched_at timestamptz,
  error text
);
alter table public.inbox_state enable row level security;
grant all on public.inbox_state to service_role;

-- Inbox reads have their own claim, so hundreds of them never hold up a post that's due.
create or replace function public.claim_jobs(worker text, n int) returns setof public.jobs
language sql security definer set search_path = public as $$
  update public.jobs set locked_at = now(), locked_by = worker, attempts = attempts + 1
  where id in (
    select id from public.jobs
    where done_at is null and run_after <= now() and attempts < max_attempts and kind <> 'inbox'
      and (locked_at is null or locked_at < now() - interval '10 minutes')
    order by run_after
    limit n
    for update skip locked
  )
  returning *
$$;

create or replace function public.claim_inbox_jobs(worker text, n int) returns setof public.jobs
language sql security definer set search_path = public as $$
  update public.jobs set locked_at = now(), locked_by = worker, attempts = attempts + 1
  where id in (
    select id from public.jobs
    where done_at is null and run_after <= now() and attempts < max_attempts and kind = 'inbox'
      and (locked_at is null or locked_at < now() - interval '10 minutes')
    order by run_after
    limit n
    for update skip locked
  )
  returning *
$$;
revoke all on function public.claim_jobs(text, int) from public, anon, authenticated;
grant execute on function public.claim_jobs(text, int) to service_role;
revoke all on function public.claim_inbox_jobs(text, int) from public, anon, authenticated;
grant execute on function public.claim_inbox_jobs(text, int) to service_role;

-- Finding a channel's waiting inbox job, and clearing old ones, stay quick with many channels.
create index if not exists jobs_inbox_open on public.jobs ((payload->>'channelId')) where kind = 'inbox' and done_at is null;
create index if not exists jobs_inbox_done on public.jobs (done_at) where kind = 'inbox';
