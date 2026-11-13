-- The app reads and writes every table with the service role on the server; the browser only uploads files through
-- one-time signed links. So signed-in users (and anon) need no direct access to tables. Supabase's default grants gave
-- them full access to every table made later (that left tables from another app wide open), so:
-- 1. Take direct table and sequence access away from anon and authenticated, now and for tables made later.
-- 2. Brand rules underneath, in case access is ever given back: brand-limited members see only their brands' rows.
-- 3. Media gets a brand, so files can be kept to the brands that use them.

-- 1. No direct access.
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm') loop
    execute format('revoke all on public.%I from anon, authenticated', t.relname);
  end loop;
end $$;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_admin') then
    execute 'alter default privileges for role supabase_admin in schema public revoke all on tables from anon, authenticated';
    execute 'alter default privileges for role supabase_admin in schema public revoke all on sequences from anon, authenticated';
  end if;
end $$;

-- 2. Brand rules.
drop policy if exists read_inbox_items on public.inbox_items;
create policy read_inbox_items on public.inbox_items for select to authenticated
  using (exists (select 1 from public.channels c where c.id = channel_id and public.sees_brand(c.workspace_id, c.brand_id)));
drop policy if exists read_channel_groups on public.channel_groups;
create policy read_channel_groups on public.channel_groups for select to authenticated using (public.sees_brand(workspace_id, brand_id));
drop policy if exists read_campaigns on public.campaigns;
create policy read_campaigns on public.campaigns for select to authenticated using (public.sees_brand(workspace_id, brand_id));

-- 3. Media brands. A file belongs to the brand it was uploaded for; files from before belong to the one brand whose
-- posts use them, or to none (seen only by members who see every brand, and by whoever uploaded it).
alter table public.media add column if not exists brand_id uuid references public.brands on delete set null;
create index if not exists media_brand on public.media (workspace_id, brand_id);
update public.media m set brand_id = u.brand_id
from (
  select m2.id, min(p.brand_id::text)::uuid as brand_id
  from public.media m2 join public.posts p on p.workspace_id = m2.workspace_id and m2.id::text = any (p.media_ids::text[])
  where p.brand_id is not null
  group by m2.id
  having count(distinct p.brand_id) = 1
) u
where m.id = u.id and m.brand_id is null;
drop policy if exists read_media on public.media;
create policy read_media on public.media for select to authenticated
  using (public.sees_brand(workspace_id, brand_id) or created_by = auth.uid());

notify pgrst, 'reload schema';
