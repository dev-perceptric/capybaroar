-- AI pictures and videos made through fal.ai. One row per request: fal's request id is saved as soon as fal takes
-- it, so a request is never sent twice, and the finished file goes to the media library. Requests have their own
-- table and claim, so a video that takes minutes never holds up a post that's due. Needs 001 only.

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  created_by uuid references auth.users on delete set null,
  kind text not null check (kind in ('image', 'video')),
  model text not null,
  prompt text not null check (char_length(prompt) between 1 and 2000),
  aspect text,
  -- Video length; it counts against the plan's seconds of video a month.
  seconds int,
  source_media_id uuid references public.media on delete set null,
  endpoint text not null,
  input jsonb not null,
  request_id text,
  status_url text,
  response_url text,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  error text,
  media_id uuid references public.media on delete set null,
  -- Failed submits and saves in a row, for the growing wait.
  tries int not null default 0,
  check_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists generations_open on public.generations (check_after) where status in ('queued', 'running');
create index if not exists generations_month on public.generations (workspace_id, created_at desc);

-- Claim requests due for a look. A step takes well under a minute, so a lock older than 5 minutes is a crashed worker's.
create or replace function public.claim_generations(worker text, n int) returns setof public.generations
language sql security definer set search_path = public as $$
  update public.generations set locked_at = now(), locked_by = worker
  where id in (
    select id from public.generations
    where status in ('queued', 'running') and check_after <= now()
      and (locked_at is null or locked_at < now() - interval '5 minutes')
    order by check_after
    limit n
    for update skip locked
  )
  returning *
$$;
revoke all on function public.claim_generations(text, int) from public, anon, authenticated;
grant execute on function public.claim_generations(text, int) to service_role;

alter table public.generations enable row level security;
drop policy if exists read_generations on public.generations;
create policy read_generations on public.generations for select to authenticated using (public.is_member(workspace_id));
