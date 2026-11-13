-- Limits that hold across every server: password sign-in and reset tries, report and invite emails, API and MCP
-- requests per key, and OAuth app registration. Each is a counter per bucket per fixed window ("login:ip:...", one
-- 15-minute window), bumped with one atomic upsert, so two servers counting at once never lose a hit.
-- Also: an authorization code remembers the grant its first use made, so a second use can revoke it (RFC 6749 4.1.2).
-- Server-only (service role): RLS on, no policies, no grants to anon or authenticated.

create table if not exists public.rate_counts (
  bucket text not null check (char_length(bucket) <= 200),
  window_start timestamptz not null,
  count int not null default 0,
  primary key (bucket, window_start)
);
create index if not exists rate_counts_window on public.rate_counts (window_start);
alter table public.rate_counts enable row level security;
revoke all on public.rate_counts from anon, authenticated;
grant all on public.rate_counts to service_role;

-- Counts `n` hits in the bucket's current window (windows start on multiples of window_s since 1970, UTC). Returns 0
-- when the total is still within `max_n`, or the seconds until the window ends when it isn't. Hits over the limit
-- still count, so a client that keeps trying stays limited until the window ends.
create or replace function public.take_rate(p_bucket text, p_window_s int, p_max int, p_n int default 1) returns int
language plpgsql security definer set search_path = public as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_s) * p_window_s);
  c int;
begin
  insert into public.rate_counts as r (bucket, window_start, count)
  values (p_bucket, w, greatest(p_n, 1))
  on conflict (bucket, window_start) do update set count = r.count + excluded.count
  returning r.count into c;
  if c <= p_max then
    return 0;
  end if;
  return greatest(1, ceil(extract(epoch from (w + make_interval(secs => p_window_s) - now())))::int);
end $$;
revoke all on function public.take_rate(text, int, int, int) from public, anon, authenticated;
grant execute on function public.take_rate(text, int, int, int) to service_role;

-- The grant an authorization code's first use made. No foreign key: the id is written when the code is redeemed,
-- just before the grant row exists, so a second use racing the first can still revoke it.
alter table public.oauth_codes add column if not exists grant_id uuid;

-- Hourly upkeep: counters from closed windows, apps that registered a week ago and were never approved, and codes
-- that expired a day ago (long past any reuse check).
create or replace function public.prune_limits() returns void
language sql security definer set search_path = public as $$
  delete from public.rate_counts where window_start < now() - interval '2 days';
  delete from public.oauth_clients c
  where c.created_at < now() - interval '7 days'
    and not exists (select 1 from public.oauth_grants g where g.client_id = c.id)
    and not exists (select 1 from public.oauth_codes k where k.client_id = c.id and k.expires_at > now());
  delete from public.oauth_codes where expires_at < now() - interval '1 day';
$$;
revoke all on function public.prune_limits() from public, anon, authenticated;
grant execute on function public.prune_limits() to service_role;
