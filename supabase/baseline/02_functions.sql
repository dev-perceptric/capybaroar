-- capybaroar: functions. Built from the running database. Unused objects were removed in the move (see README.md).
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- function: attach_generation(uuid)
CREATE FUNCTION public.attach_generation(g uuid) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  update public.posts p
  set media_ids = array_append(p.media_ids, gen.media_id), updated_at = now()
  from public.generations gen
  where gen.id = g and gen.post_id = p.id and gen.workspace_id = p.workspace_id
    and gen.status = 'done' and gen.media_id is not null and gen.kind <> 'audio'
    and not (gen.media_id = any (p.media_ids))
    and p.status in ('draft', 'review')
$$;

ALTER FUNCTION public.attach_generation(g uuid) OWNER TO postgres;

-- function: bio_click(uuid, text)
CREATE FUNCTION public.bio_click(p_page uuid, p_item text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  insert into public.bio_views as v (page_id, day, clicks, items)
  values (p_page, (now() at time zone 'utc')::date, 1, jsonb_build_object(coalesce(p_item, 'page'), 1))
  on conflict (page_id, day) do update set
    clicks = v.clicks + 1,
    items = case
      when v.items ? coalesce(p_item, 'page') or (select count(*) from jsonb_object_keys(v.items)) < 200
        then jsonb_set(v.items, array[coalesce(p_item, 'page')], to_jsonb(coalesce((v.items ->> coalesce(p_item, 'page'))::int, 0) + 1))
      else v.items
    end
$$;

ALTER FUNCTION public.bio_click(p_page uuid, p_item text) OWNER TO postgres;

-- function: bio_view(uuid, text, text)
CREATE FUNCTION public.bio_view(p_page uuid, p_visitor text, p_ref text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  n int;
  d date := (now() at time zone 'utc')::date;
  h text := left(coalesce(p_ref, ''), 100);
begin
  insert into public.bio_visits as s (page_id, visitor, seen_at) values (p_page, p_visitor, now())
  on conflict (page_id, visitor) do update set seen_at = excluded.seen_at
  where s.seen_at <= now() - interval '30 minutes';
  get diagnostics n = row_count;
  if n = 0 then
    return false;
  end if;
  insert into public.bio_views as v (page_id, day, views, referrers)
  values (p_page, d, 1, case when h = '' then '{}'::jsonb else jsonb_build_object(h, 1) end)
  on conflict (page_id, day) do update set
    views = v.views + 1,
    referrers = case
      when h = '' then v.referrers
      when v.referrers ? h or (select count(*) from jsonb_object_keys(v.referrers)) < 50
        then jsonb_set(v.referrers, array[h], to_jsonb(coalesce((v.referrers ->> h)::int, 0) + 1))
      else jsonb_set(v.referrers, '{other}', to_jsonb(coalesce((v.referrers ->> 'other')::int, 0) + 1))
    end;
  if random() < 0.02 then
    delete from public.bio_visits where seen_at < now() - interval '2 hours';
  end if;
  return true;
end
$$;

ALTER FUNCTION public.bio_view(p_page uuid, p_visitor text, p_ref text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

-- function: claim_generations(text, integer)
CREATE FUNCTION public.claim_generations(worker text, n integer) RETURNS SETOF public.generations
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

ALTER FUNCTION public.claim_generations(worker text, n integer) OWNER TO postgres;

-- function: claim_inbox_jobs(text, integer)
CREATE FUNCTION public.claim_inbox_jobs(worker text, n integer) RETURNS SETOF public.jobs
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

ALTER FUNCTION public.claim_inbox_jobs(worker text, n integer) OWNER TO postgres;

-- function: claim_jobs(text, integer)
CREATE FUNCTION public.claim_jobs(worker text, n integer) RETURNS SETOF public.jobs
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

ALTER FUNCTION public.claim_jobs(worker text, n integer) OWNER TO postgres;

-- function: claim_webhook_deliveries(text, integer)
CREATE FUNCTION public.claim_webhook_deliveries(worker text, n integer) RETURNS SETOF public.webhook_deliveries
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

ALTER FUNCTION public.claim_webhook_deliveries(worker text, n integer) OWNER TO postgres;

-- function: credit_brand_used(uuid, text)
CREATE FUNCTION public.credit_brand_used(ws uuid, p_period text) RETURNS TABLE(brand_id uuid, used bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select brand_id, -sum(amount) from public.credit_entries
  where workspace_id = ws and brand_id is not null and period = p_period and kind <> 'grant'
  group by brand_id
$$;

ALTER FUNCTION public.credit_brand_used(ws uuid, p_period text) OWNER TO postgres;

-- function: credit_grant(uuid, text, text, text, integer, timestamp with time zone, text)
CREATE FUNCTION public.credit_grant(ws uuid, p_key text, p_bucket text, p_period text, p_amount integer, p_expires timestamp with time zone, p_note text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

ALTER FUNCTION public.credit_grant(ws uuid, p_key text, p_bucket text, p_period text, p_amount integer, p_expires timestamp with time zone, p_note text) OWNER TO postgres;

-- function: credit_left(uuid, text)
CREATE FUNCTION public.credit_left(ws uuid, p_period text) RETURNS TABLE(plan bigint, bought bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    greatest(0, coalesce((select sum(amount) from public.credit_entries where workspace_id = ws and bucket = 'plan' and period = p_period), 0)),
    greatest(0, coalesce((
      select sum(greatest(0, g.amount + coalesce((select sum(e.amount) from public.credit_entries e where e.lot = g.id), 0)))
      from public.credit_entries g
      where g.workspace_id = ws and g.bucket = 'bought' and g.kind = 'grant' and g.expires_at > now()
    ), 0))
$$;

ALTER FUNCTION public.credit_left(ws uuid, p_period text) OWNER TO postgres;

-- function: credit_lock(uuid)
CREATE FUNCTION public.credit_lock(ws uuid) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select pg_advisory_xact_lock(hashtextextended('credits:' || ws::text, 0))
$$;

ALTER FUNCTION public.credit_lock(ws uuid) OWNER TO postgres;

-- function: credit_release(uuid, text)
CREATE FUNCTION public.credit_release(ws uuid, p_key text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

ALTER FUNCTION public.credit_release(ws uuid, p_key text) OWNER TO postgres;

-- function: credit_settle(uuid, text, integer, text, uuid)
CREATE FUNCTION public.credit_settle(ws uuid, p_key text, p_amount integer, p_period text, p_post uuid DEFAULT NULL::uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

ALTER FUNCTION public.credit_settle(ws uuid, p_key text, p_amount integer, p_period text, p_post uuid) OWNER TO postgres;

-- function: credit_stale_holds(interval, integer)
CREATE FUNCTION public.credit_stale_holds(age interval, n integer DEFAULT 200) RETURNS TABLE(workspace_id uuid, key text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

ALTER FUNCTION public.credit_stale_holds(age interval, n integer) OWNER TO postgres;

-- function: credit_take(uuid, text, text, integer, integer, text, boolean, uuid, uuid, text, text, uuid, text)
CREATE FUNCTION public.credit_take(ws uuid, p_key text, p_kind text, p_seq integer, p_amount integer, p_period text, p_partial boolean, p_brand uuid DEFAULT NULL::uuid, p_user uuid DEFAULT NULL::uuid, p_tool text DEFAULT NULL::text, p_model text DEFAULT NULL::text, p_post uuid DEFAULT NULL::uuid, p_note text DEFAULT NULL::text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

ALTER FUNCTION public.credit_take(ws uuid, p_key text, p_kind text, p_seq integer, p_amount integer, p_period text, p_partial boolean, p_brand uuid, p_user uuid, p_tool text, p_model text, p_post uuid, p_note text) OWNER TO postgres;

-- function: end_turn(text, text)
CREATE FUNCTION public.end_turn(job_name text, worker text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  update public.upkeep_runs set busy_until = null where name = job_name and ran_by = worker
$$;

ALTER FUNCTION public.end_turn(job_name text, worker text) OWNER TO postgres;

-- function: is_member(uuid)
CREATE FUNCTION public.is_member(ws uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (select 1 from public.members where workspace_id = ws and user_id = auth.uid())
$$;

ALTER FUNCTION public.is_member(ws uuid) OWNER TO postgres;

-- function: keep_locks(bigint[], text)
CREATE FUNCTION public.keep_locks(ids bigint[], worker text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  update public.jobs set locked_at = now() where id = any(ids) and locked_by = worker and done_at is null and locked_at is not null
$$;

ALTER FUNCTION public.keep_locks(ids bigint[], worker text) OWNER TO postgres;

-- function: link_click(text)
CREATE FUNCTION public.link_click(p_code text) RETURNS text
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  update public.links set clicks = clicks + 1 where code = p_code returning url;
$$;

ALTER FUNCTION public.link_click(p_code text) OWNER TO postgres;

-- function: link_open(text, boolean)
CREATE FUNCTION public.link_open(p_code text, p_human boolean) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_url text;
  v_page uuid;
  v_item text;
begin
  update public.links set clicks = clicks + 1 where code = p_code returning url, page_id, item into v_url, v_page, v_item;
  if v_page is not null and p_human then
    begin
      perform public.bio_click(v_page, v_item);
    exception when others then
      null;
    end;
  end if;
  return v_url;
end
$$;

ALTER FUNCTION public.link_open(p_code text, p_human boolean) OWNER TO postgres;

-- function: queue_report(uuid, text, text, timestamp with time zone)
CREATE FUNCTION public.queue_report(report uuid, seen text, period text, due timestamp with time zone) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  update public.reports set queued_period = period where id = report and queued_period is not distinct from seen;
  if not found then
    return false;
  end if;
  insert into public.jobs (kind, payload) values ('report', jsonb_build_object('reportId', report, 'period', period, 'at', due));
  return true;
end
$$;

ALTER FUNCTION public.queue_report(report uuid, seen text, period text, due timestamp with time zone) OWNER TO postgres;

-- function: record_error(text, text, text, text, text, boolean)
CREATE FUNCTION public.record_error(fp text, msg text, trace text, at_route text, at_machine text, mail boolean) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

ALTER FUNCTION public.record_error(fp text, msg text, trace text, at_route text, at_machine text, mail boolean) OWNER TO postgres;

-- function: sees_brand(uuid, uuid)
CREATE FUNCTION public.sees_brand(ws uuid, brand uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.members
    where workspace_id = ws and user_id = auth.uid() and (brand_ids is null or brand = any (brand_ids))
  )
$$;

ALTER FUNCTION public.sees_brand(ws uuid, brand uuid) OWNER TO postgres;

-- function: take_turn(text, integer, integer, text)
CREATE FUNCTION public.take_turn(job_name text, every_s integer, lease_s integer, worker text) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  with won as (
    insert into public.upkeep_runs as u (name, ran_at, ran_by, busy_until)
    values (job_name, now(), worker, now() + make_interval(secs => lease_s))
    on conflict (name) do update set ran_at = now(), ran_by = excluded.ran_by, busy_until = excluded.busy_until
    where u.ran_at <= now() - make_interval(secs => every_s) and (u.busy_until is null or u.busy_until < now())
    returning 1
  )
  select exists (select 1 from won)
$$;

ALTER FUNCTION public.take_turn(job_name text, every_s integer, lease_s integer, worker text) OWNER TO postgres;

-- function: trigger_set_timestamps()
CREATE FUNCTION public.trigger_set_timestamps() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW."createdAt" = NOW();
        NEW."updatedAt" = NOW();
        NEW."createdAtZ" = NOW();
        NEW."updatedAtZ" = NOW();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW."updatedAt" = NOW();
        NEW."updatedAtZ" = NOW();
        NEW."createdAt" = OLD."createdAt";
        NEW."createdAtZ" = OLD."createdAtZ";
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.trigger_set_timestamps() OWNER TO postgres;
