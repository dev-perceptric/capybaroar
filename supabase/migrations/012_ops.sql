-- Ops: safe to run on two or more servers, a health check, error tracking and backups.
-- Everything here is server-only (service role): RLS on, no policies, no grants to anon or authenticated.

-- Each server's runner writes its row every minute; /api/health reads its own server's row.
create table if not exists public.runner_beats (
  machine text primary key,
  beat_at timestamptz not null default now(),
  started_at timestamptz not null default now(),
  version text
);
alter table public.runner_beats enable row level security;
revoke all on public.runner_beats from anon, authenticated;
grant all on public.runner_beats to service_role;

-- Periodic work done once per period whichever server gets there first (take_turn). `busy_until` keeps a long run
-- from overlapping the next one; a server that dies mid-run frees it when the lease runs out.
create table if not exists public.upkeep_runs (
  name text primary key,
  ran_at timestamptz not null,
  ran_by text not null,
  busy_until timestamptz
);
alter table public.upkeep_runs enable row level security;
revoke all on public.upkeep_runs from anon, authenticated;
grant all on public.upkeep_runs to service_role;

-- One winner per period: the insert or the conditional update succeeds for exactly one caller (the row lock makes
-- the second caller re-check the condition and find it false).
create or replace function public.take_turn(job_name text, every_s int, lease_s int, worker text) returns boolean
language sql security definer set search_path = public as $$
  with won as (
    insert into public.upkeep_runs as u (name, ran_at, ran_by, busy_until)
    values (job_name, now(), worker, now() + make_interval(secs => lease_s))
    on conflict (name) do update set ran_at = now(), ran_by = excluded.ran_by, busy_until = excluded.busy_until
    where u.ran_at <= now() - make_interval(secs => every_s) and (u.busy_until is null or u.busy_until < now())
    returning 1
  )
  select exists (select 1 from won)
$$;

-- The winner is done: the next period may start (only the winner's own turn is ended).
create or replace function public.end_turn(job_name text, worker text) returns void
language sql security definer set search_path = public as $$
  update public.upkeep_runs set busy_until = null where name = job_name and ran_by = worker
$$;

-- Jobs a server is still working on keep their lock, so no other server takes them over after 10 minutes.
create or replace function public.keep_locks(ids bigint[], worker text) returns void
language sql security definer set search_path = public as $$
  update public.jobs set locked_at = now() where id = any(ids) and locked_by = worker and done_at is null and locked_at is not null
$$;

-- Server errors, one row per fingerprint (message and top stack frame). Messages and stacks are scrubbed of tokens
-- by the app before they get here.
create table if not exists public.app_errors (
  fingerprint text primary key,
  message text not null,
  stack text,
  route text,
  machine text,
  count bigint not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  emailed_at timestamptz
);
create index if not exists app_errors_last_seen on public.app_errors (last_seen);
alter table public.app_errors enable row level security;
revoke all on public.app_errors from anon, authenticated;
grant all on public.app_errors to service_role;

-- Counts an error and says whether to email it: at most once per fingerprint per hour, across every server. The
-- second update waits for the first one's row lock, then finds emailed_at fresh and changes nothing.
create or replace function public.record_error(fp text, msg text, trace text, at_route text, at_machine text, mail boolean)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_errors as e (fingerprint, message, stack, route, machine)
  values (fp, msg, trace, at_route, at_machine)
  on conflict (fingerprint) do update set
    count = e.count + 1,
    last_seen = now(),
    message = excluded.message,
    stack = excluded.stack,
    route = excluded.route,
    machine = excluded.machine;
  if not mail then
    return false;
  end if;
  update public.app_errors set emailed_at = now()
  where fingerprint = fp and (emailed_at is null or emailed_at < now() - interval '1 hour');
  return found;
end
$$;

revoke all on function public.take_turn(text, int, int, text) from public, anon, authenticated;
revoke all on function public.end_turn(text, text) from public, anon, authenticated;
revoke all on function public.keep_locks(bigint[], text) from public, anon, authenticated;
revoke all on function public.record_error(text, text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.take_turn(text, int, int, text) to service_role;
grant execute on function public.end_turn(text, text) to service_role;
grant execute on function public.keep_locks(bigint[], text) to service_role;
grant execute on function public.record_error(text, text, text, text, text, boolean) to service_role;

-- Database backups (ops/backup.sh): a private bucket, reached only with the service key.
insert into storage.buckets (id, name, public) values ('backups', 'backups', false) on conflict (id) do nothing;
