-- Credits: one ledger for everything AI costs (pictures, videos, audio and Claude). 1 credit is 1 cent of price to
-- the customer, and every action is priced at 2.5 times what it costs us (creditRules.ts). Needs 004 and 006.
--
-- - Rows are only ever added. A balance is the sum of its rows.
-- - Plan credits are one bucket per period (the refill date, 'YYYY-MM-DD', or 'trial'): a new period starts from its
--   own grant, so unused plan credits never roll over. Bought credits are lots that last 12 months; a spend takes
--   plan credits first, then the lot that ends soonest.
-- - Every change runs under one lock per workspace, so two servers spending at once can never take the same credit.
-- - Each action has a key (gen:<id>, agent:<id>, write:<id>, bio:<id>, plan:<period>:<n>, topup:<stripe id>). A hold,
--   charge or grant that already exists for its key is never written again, so a retry never charges twice.
-- - An action holds its price first and settles when it ends: settle gives the hold back and charges what it really
--   used (nothing when it failed).

-- Plans: Creator joins, and each workspace keeps how it pays and the day its credits refill.
alter table public.workspaces drop constraint if exists workspaces_plan_check;
alter table public.workspaces add constraint workspaces_plan_check check (plan in ('free', 'creator', 'pro', 'agency'));
alter table public.workspaces
  add column if not exists billing_interval text check (billing_interval in ('month', 'year')),
  add column if not exists credit_anchor timestamptz,
  add column if not exists auto_topup_pack int check (auto_topup_pack in (1000, 5000, 20000)),
  add column if not exists auto_topup_max int not null default 2 check (auto_topup_max between 1 and 10),
  add column if not exists topup_wanted_at timestamptz;

-- Emails when 80% and all of a period's plan credits are used, and when an automatic top-up can't be charged.
alter table public.alerts drop constraint if exists alerts_kind_check;
alter table public.alerts add constraint alerts_kind_check check (kind in ('post_failed', 'reconnect', 'credits', 'topup_failed'));

-- Agency: a monthly credit limit for each brand (null: no limit).
alter table public.brands add column if not exists credit_limit int check (credit_limit is null or credit_limit between 0 and 10000000);

create table if not exists public.credit_entries (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces on delete cascade,
  key text not null check (char_length(key) between 1 and 200),
  kind text not null check (kind in ('grant', 'hold', 'release', 'charge')),
  -- An agent message can hold more than once: each hold has its own number.
  seq int not null default 0,
  bucket text not null check (bucket in ('plan', 'bought')),
  -- Plan grants: the period they belong to. Every spend: the plan period it happened in (brand limits count by it).
  period text,
  -- Spends from bought credits: the grant (lot) they come from.
  lot bigint references public.credit_entries,
  -- Bought grants: when the lot ends.
  expires_at timestamptz,
  -- Grants and releases add, holds and charges take away.
  amount int not null,
  brand_id uuid references public.brands on delete set null,
  user_id uuid references auth.users on delete set null,
  tool text,
  model text,
  post_id uuid,
  note text,
  created_at timestamptz not null default now(),
  check ((kind in ('grant', 'release')) = (amount >= 0))
);
create unique index if not exists credit_entries_once on public.credit_entries (workspace_id, key, kind, seq, bucket, coalesce(lot, 0));
create index if not exists credit_entries_plan on public.credit_entries (workspace_id, period) where bucket = 'plan';
create index if not exists credit_entries_lots on public.credit_entries (workspace_id, expires_at) where bucket = 'bought' and kind = 'grant';
create index if not exists credit_entries_lot on public.credit_entries (lot) where lot is not null;
create index if not exists credit_entries_key on public.credit_entries (workspace_id, key);
create index if not exists credit_entries_brand on public.credit_entries (brand_id, period) where brand_id is not null;
create index if not exists credit_entries_recent on public.credit_entries (workspace_id, created_at desc);
create index if not exists credit_entries_holds on public.credit_entries (created_at) where kind = 'hold';

alter table public.credit_entries enable row level security;
grant all on public.credit_entries to service_role;

-- One lock per workspace, held to the end of the transaction.
create or replace function public.credit_lock(ws uuid) returns void
language sql security definer set search_path = public as $$
  select pg_advisory_xact_lock(hashtextextended('credits:' || ws::text, 0))
$$;

-- What's left: this period's plan credits, and bought credits in lots that haven't ended.
create or replace function public.credit_left(ws uuid, p_period text) returns table (plan bigint, bought bigint)
language sql stable security definer set search_path = public as $$
  select
    greatest(0, coalesce((select sum(amount) from public.credit_entries where workspace_id = ws and bucket = 'plan' and period = p_period), 0)),
    greatest(0, coalesce((
      select sum(greatest(0, g.amount + coalesce((select sum(e.amount) from public.credit_entries e where e.lot = g.id), 0)))
      from public.credit_entries g
      where g.workspace_id = ws and g.bucket = 'bought' and g.kind = 'grant' and g.expires_at > now()
    ), 0))
$$;

-- Add credits once per key. Returns false when that key was already granted.
create or replace function public.credit_grant(ws uuid, p_key text, p_bucket text, p_period text, p_amount int, p_expires timestamptz, p_note text default null)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_amount is null or p_amount <= 0 then raise exception 'grant must be more than 0'; end if;
  if p_bucket = 'plan' and p_period is null then raise exception 'plan credits need a period'; end if;
  if p_bucket = 'bought' and p_expires is null then raise exception 'bought credits need an end date'; end if;
  if p_bucket not in ('plan', 'bought') then raise exception 'unknown bucket %', p_bucket; end if;
  perform public.credit_lock(ws);
  if exists (select 1 from public.credit_entries where workspace_id = ws and key = p_key and kind = 'grant') then
    return false;
  end if;
  insert into public.credit_entries (workspace_id, key, kind, bucket, period, expires_at, amount, note)
  values (ws, p_key, 'grant', p_bucket, case when p_bucket = 'plan' then p_period end, case when p_bucket = 'bought' then p_expires end, p_amount, p_note);
  return true;
end $$;

-- Take credits for a hold or a charge: plan credits first, then the lot that ends soonest. Without p_partial it takes
-- all or nothing and raises out_of_credits (or brand_limit); with it, it takes what there is. A key, kind and seq
-- that was already taken returns what it took then, without taking again.
create or replace function public.credit_take(
  ws uuid, p_key text, p_kind text, p_seq int, p_amount int, p_period text, p_partial boolean,
  p_brand uuid default null, p_user uuid default null, p_tool text default null, p_model text default null, p_post uuid default null, p_note text default null
) returns int
language plpgsql security definer set search_path = public as $$
declare
  prior bigint;
  lim int;
  used bigint;
  want int := p_amount;
  plan_left bigint;
  lots_left bigint := 0;
  got int := 0;
  part int;
  r record;
begin
  if p_kind not in ('hold', 'charge') then raise exception 'kind must be hold or charge'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'amount must be 0 or more'; end if;
  perform public.credit_lock(ws);
  select -sum(amount) into prior from public.credit_entries where workspace_id = ws and key = p_key and kind = p_kind and seq = p_seq;
  if prior is not null then return prior; end if;
  if want = 0 then return 0; end if;

  if p_brand is not null then
    select credit_limit into lim from public.brands where id = p_brand and workspace_id = ws;
    if lim is not null then
      select coalesce(-sum(amount), 0) into used from public.credit_entries
      where workspace_id = ws and brand_id = p_brand and period = p_period and kind <> 'grant';
      if used + want > lim then
        if not p_partial then raise exception 'brand_limit' using detail = greatest(lim - used, 0)::text; end if;
        want := greatest(lim - used, 0)::int;
      end if;
    end if;
  end if;

  select coalesce(sum(amount), 0) into plan_left from public.credit_entries where workspace_id = ws and bucket = 'plan' and period = p_period;
  plan_left := greatest(plan_left, 0);
  select coalesce(sum(greatest(0, g.amount + coalesce((select sum(e.amount) from public.credit_entries e where e.lot = g.id), 0))), 0) into lots_left
  from public.credit_entries g
  where g.workspace_id = ws and g.bucket = 'bought' and g.kind = 'grant' and g.expires_at > now();
  if plan_left + lots_left < want then
    if not p_partial then raise exception 'out_of_credits' using detail = (plan_left + lots_left)::text; end if;
    want := (plan_left + lots_left)::int;
  end if;

  part := least(plan_left, want)::int;
  if part > 0 then
    insert into public.credit_entries (workspace_id, key, kind, seq, bucket, period, amount, brand_id, user_id, tool, model, post_id, note)
    values (ws, p_key, p_kind, p_seq, 'plan', p_period, -part, p_brand, p_user, p_tool, p_model, p_post, p_note);
    got := part;
  end if;
  for r in
    select g.id, g.amount + coalesce((select sum(e.amount) from public.credit_entries e where e.lot = g.id), 0) as left_now
    from public.credit_entries g
    where g.workspace_id = ws and g.bucket = 'bought' and g.kind = 'grant' and g.expires_at > now()
    order by g.expires_at, g.id
  loop
    exit when got >= want;
    if r.left_now > 0 then
      part := least(r.left_now, want - got)::int;
      insert into public.credit_entries (workspace_id, key, kind, seq, bucket, period, lot, amount, brand_id, user_id, tool, model, post_id, note)
      values (ws, p_key, p_kind, p_seq, 'bought', p_period, r.id, -part, p_brand, p_user, p_tool, p_model, p_post, p_note);
      got := got + part;
    end if;
  end loop;
  return got;
end $$;

-- Give back every hold under a key that hasn't been given back. Returns the credits given back. Safe to repeat.
create or replace function public.credit_release(ws uuid, p_key text) returns int
language plpgsql security definer set search_path = public as $$
declare
  r record;
  n int := 0;
begin
  perform public.credit_lock(ws);
  for r in
    select h.* from public.credit_entries h
    where h.workspace_id = ws and h.key = p_key and h.kind = 'hold'
      and not exists (
        select 1 from public.credit_entries x
        where x.workspace_id = ws and x.key = p_key and x.kind = 'release' and x.seq = h.seq and x.bucket = h.bucket and coalesce(x.lot, 0) = coalesce(h.lot, 0)
      )
  loop
    insert into public.credit_entries (workspace_id, key, kind, seq, bucket, period, lot, amount, brand_id, user_id, tool, model, post_id, note)
    values (ws, p_key, 'release', r.seq, r.bucket, r.period, r.lot, -r.amount, r.brand_id, r.user_id, r.tool, r.model, r.post_id, r.note);
    n := n - r.amount;
  end loop;
  return n;
end $$;

-- End an action: give its holds back and charge what it used (p_amount, 0 when it failed). Only a key that holds
-- credits can be charged. The charge may be more than the hold (an agent's last step) and stops at what's left.
-- Returns the credits charged. Safe to repeat: a key is charged once.
create or replace function public.credit_settle(ws uuid, p_key text, p_amount int, p_period text, p_post uuid default null)
returns int
language plpgsql security definer set search_path = public as $$
declare
  prior bigint;
  h record;
begin
  perform public.credit_lock(ws);
  select -sum(amount) into prior from public.credit_entries where workspace_id = ws and key = p_key and kind = 'charge';
  if prior is not null then return prior; end if;
  select * into h from public.credit_entries where workspace_id = ws and key = p_key and kind = 'hold' order by id limit 1;
  if not found then return 0; end if;
  perform public.credit_release(ws, p_key);
  if coalesce(p_amount, 0) <= 0 then return 0; end if;
  return public.credit_take(ws, p_key, 'charge', 0, p_amount, p_period, true, h.brand_id, h.user_id, h.tool, h.model, coalesce(p_post, h.post_id), h.note);
end $$;

-- Holds older than `age` that were never settled (a server stopped mid-action), for the hourly sweep.
create or replace function public.credit_stale_holds(age interval, n int default 200) returns table (workspace_id uuid, key text)
language sql stable security definer set search_path = public as $$
  select distinct h.workspace_id, h.key
  from public.credit_entries h
  where h.kind = 'hold' and h.created_at < now() - age and h.created_at > now() - interval '30 days'
    and not exists (select 1 from public.credit_entries x where x.workspace_id = h.workspace_id and x.key = h.key and x.kind = 'charge')
    and not exists (
      select 1 from public.credit_entries x
      where x.workspace_id = h.workspace_id and x.key = h.key and x.kind = 'release' and x.seq = h.seq and x.bucket = h.bucket and coalesce(x.lot, 0) = coalesce(h.lot, 0)
    )
  limit n
$$;

-- What a brand has used this period (for Agency's brand limits).
create or replace function public.credit_brand_used(ws uuid, p_period text) returns table (brand_id uuid, used bigint)
language sql stable security definer set search_path = public as $$
  select brand_id, -sum(amount) from public.credit_entries
  where workspace_id = ws and brand_id is not null and period = p_period and kind <> 'grant'
  group by brand_id
$$;

revoke all on function public.credit_lock(uuid) from public, anon, authenticated;
revoke all on function public.credit_left(uuid, text) from public, anon, authenticated;
revoke all on function public.credit_grant(uuid, text, text, text, int, timestamptz, text) from public, anon, authenticated;
revoke all on function public.credit_take(uuid, text, text, int, int, text, boolean, uuid, uuid, text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.credit_release(uuid, text) from public, anon, authenticated;
revoke all on function public.credit_settle(uuid, text, int, text, uuid) from public, anon, authenticated;
revoke all on function public.credit_stale_holds(interval, int) from public, anon, authenticated;
revoke all on function public.credit_brand_used(uuid, text) from public, anon, authenticated;
grant execute on function public.credit_lock(uuid) to service_role;
grant execute on function public.credit_left(uuid, text) to service_role;
grant execute on function public.credit_grant(uuid, text, text, text, int, timestamptz, text) to service_role;
grant execute on function public.credit_take(uuid, text, text, int, int, text, boolean, uuid, uuid, text, text, uuid, text) to service_role;
grant execute on function public.credit_release(uuid, text) to service_role;
grant execute on function public.credit_settle(uuid, text, int, text, uuid) to service_role;
grant execute on function public.credit_stale_holds(interval, int) to service_role;
grant execute on function public.credit_brand_used(uuid, text) to service_role;
