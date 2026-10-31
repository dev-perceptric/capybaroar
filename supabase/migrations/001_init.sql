-- Capybaroar v2: workspaces, channels, posts, media, jobs, analytics and the agent.
-- Signed-in users read their workspace's rows through row-level security. Every write goes through the server
-- (service role), which checks membership first. Tokens, jobs and OAuth states are server-only.

create extension if not exists pgcrypto;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table public.members (
  workspace_id uuid not null references public.workspaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'editor')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index members_user on public.members (user_id);

create or replace function public.is_member(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where workspace_id = ws and user_id = auth.uid())
$$;

-- One connected account: a LinkedIn profile, a Facebook Page, a TikTok account.
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  network text not null,
  account_id text not null,
  name text not null,
  username text,
  avatar text,
  status text not null default 'active' check (status in ('active', 'reconnect')),
  created_at timestamptz not null default now(),
  unique (workspace_id, network, account_id)
);

-- Tokens, encrypted by the app (AES-256-GCM). No grants to signed-in users.
create table public.channel_secrets (
  channel_id uuid primary key references public.channels on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  extra jsonb not null default '{}'
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  path text not null unique,
  name text not null,
  mime text not null,
  size bigint not null,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  created_by uuid references auth.users on delete set null,
  text text not null default '',
  media_ids uuid[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'publishing', 'published', 'partial', 'failed')),
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_calendar on public.posts (workspace_id, publish_at);

-- One post on one channel. remote_id is saved before a job is marked done, so a retry never posts twice.
create table public.post_targets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  channel_id uuid not null references public.channels on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'publishing', 'published', 'failed')),
  remote_id text,
  url text,
  error text,
  published_at timestamptz,
  unique (post_id, channel_id)
);

create table public.jobs (
  id bigserial primary key,
  kind text not null,
  payload jsonb not null default '{}',
  run_after timestamptz not null default now(),
  attempts int not null default 0,
  max_attempts int not null default 6,
  locked_at timestamptz,
  locked_by text,
  done_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index jobs_due on public.jobs (run_after) where done_at is null;

-- Claim due jobs. A lock older than 10 minutes counts as a crashed worker and is taken over.
create or replace function public.claim_jobs(worker text, n int) returns setof public.jobs
language sql security definer set search_path = public as $$
  update public.jobs set locked_at = now(), locked_by = worker, attempts = attempts + 1
  where id in (
    select id from public.jobs
    where done_at is null and run_after <= now() and attempts < max_attempts
      and (locked_at is null or locked_at < now() - interval '10 minutes')
    order by run_after
    limit n
    for update skip locked
  )
  returning *
$$;

create table public.oauth_states (
  state text primary key,
  workspace_id uuid not null references public.workspaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  network text not null,
  verifier text,
  created_at timestamptz not null default now()
);

create table public.metrics (
  channel_id uuid not null references public.channels on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  day date not null,
  followers int,
  posts int,
  impressions int,
  engagements int,
  primary key (channel_id, day)
);

create table public.agent_chats (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now()
);

create table public.agent_messages (
  id bigserial primary key,
  chat_id uuid not null references public.agent_chats on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table public.ai_cache (
  key text primary key,
  response jsonb not null,
  created_at timestamptz not null default now()
);

-- Row-level security: members read their workspace. Server-only tables get no policies.
alter table public.workspaces enable row level security;
alter table public.members enable row level security;
alter table public.channels enable row level security;
alter table public.channel_secrets enable row level security;
alter table public.media enable row level security;
alter table public.posts enable row level security;
alter table public.post_targets enable row level security;
alter table public.jobs enable row level security;
alter table public.oauth_states enable row level security;
alter table public.metrics enable row level security;
alter table public.agent_chats enable row level security;
alter table public.agent_messages enable row level security;
alter table public.ai_cache enable row level security;

create policy read_ws on public.workspaces for select to authenticated using (public.is_member(id));
create policy read_members on public.members for select to authenticated using (public.is_member(workspace_id));
create policy read_channels on public.channels for select to authenticated using (public.is_member(workspace_id));
create policy read_media on public.media for select to authenticated using (public.is_member(workspace_id));
create policy read_posts on public.posts for select to authenticated using (public.is_member(workspace_id));
create policy read_targets on public.post_targets for select to authenticated using (public.is_member(workspace_id));
create policy read_metrics on public.metrics for select to authenticated using (public.is_member(workspace_id));
create policy read_chats on public.agent_chats for select to authenticated using (user_id = auth.uid());
create policy read_messages on public.agent_messages for select to authenticated
  using (exists (select 1 from public.agent_chats c where c.id = chat_id and c.user_id = auth.uid()));

-- This project's default privileges give new tables to nobody, so grant exactly what's needed.
grant usage on schema public to authenticated, service_role;
grant select on public.workspaces, public.members, public.channels, public.media, public.posts, public.post_targets,
  public.metrics, public.agent_chats, public.agent_messages to authenticated;
grant all on public.workspaces, public.members, public.channels, public.channel_secrets, public.media, public.posts, public.post_targets,
  public.jobs, public.oauth_states, public.metrics, public.agent_chats, public.agent_messages, public.ai_cache to service_role;
grant all on sequence public.jobs_id_seq, public.agent_messages_id_seq to service_role;
revoke all on function public.claim_jobs(text, int) from public, anon, authenticated;
grant execute on function public.claim_jobs(text, int) to service_role;
grant execute on function public.is_member(uuid) to authenticated, service_role;

-- Uploaded media: a private bucket, read through signed links made by the server.
insert into storage.buckets (id, name, public) values ('media', 'media', false) on conflict (id) do nothing;
