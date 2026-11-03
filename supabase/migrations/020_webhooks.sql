-- Webhooks: the workspace's own URLs, told when a post goes out, fails, waits for approval, is approved or sent
-- back, or a channel needs reconnecting. Deliveries have their own table and their own claim, so a slow URL never
-- holds up a post that's due. A delivery keeps the exact body it signs, so every try sends the same event.
-- Numbered 020 to stay clear of the other migrations being written at the same time; it needs only 001.

create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  created_by uuid references auth.users on delete set null,
  url text not null check (char_length(url) between 10 and 2000),
  events text[] not null check (cardinality(events) > 0),
  -- The signing secret, sealed with TOKEN_KEY like channel tokens.
  secret text not null,
  enabled boolean not null default true,
  -- Deliveries in a row that used every try. At 5 the webhook turns itself off.
  failures int not null default 0,
  last_status int,
  last_error text,
  last_delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists webhooks_ws on public.webhooks (workspace_id);

create table if not exists public.webhook_deliveries (
  id bigint generated always as identity primary key,
  webhook_id uuid not null references public.webhooks on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  event text not null,
  event_id text not null,
  body text not null,
  attempts int not null default 0,
  max_attempts int not null default 8,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  done_at timestamptz,
  status int,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists webhook_deliveries_due on public.webhook_deliveries (run_after) where done_at is null;
create index if not exists webhook_deliveries_hook on public.webhook_deliveries (webhook_id, created_at desc);
create index if not exists webhook_deliveries_done on public.webhook_deliveries (done_at) where done_at is not null;

-- Claim due deliveries. A try takes at most 10 seconds, so a lock older than 2 minutes is a crashed worker's.
create or replace function public.claim_webhook_deliveries(worker text, n int) returns setof public.webhook_deliveries
language sql security definer set search_path = public as $$
  update public.webhook_deliveries set locked_at = now(), locked_by = worker, attempts = attempts + 1
  where id in (
    select id from public.webhook_deliveries
    where done_at is null and run_after <= now() and attempts < max_attempts
      and (locked_at is null or locked_at < now() - interval '2 minutes')
    order by run_after
    limit n
    for update skip locked
  )
  returning *
$$;

alter table public.webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;
grant all on public.webhooks, public.webhook_deliveries to service_role;
grant all on sequence public.webhook_deliveries_id_seq to service_role;
revoke all on function public.claim_webhook_deliveries(text, int) from public, anon, authenticated;
grant execute on function public.claim_webhook_deliveries(text, int) to service_role;
