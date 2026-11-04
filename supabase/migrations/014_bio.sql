-- Link in bio as its own feature: pages made of blocks, an appearance, search and share settings, the "Made with
-- Capybaroar" badge, and private visit counts. Builds on 011 (bio_pages) and 005 (links). Safe to run more than once.
-- Run it before deploying the code that reads it.

-- Pages: blocks ({"v": 1, "items": [...]}, at most 50, checked by the app in src/lib/bioBlocks.ts), the look
-- ({"theme", "shape", "fill", "size"}), the title, description and picture shown when the page is shared, and the badge.
-- 011's links, show_posts and theme stay and are kept in step by the app, so an older server still shows the page.
-- blocks is null only for a page an older server made after this ran; the app then reads its links instead.
alter table public.bio_pages add column if not exists blocks jsonb
  check (blocks is null or (jsonb_typeof(blocks) = 'object' and jsonb_typeof(blocks -> 'items') = 'array' and jsonb_array_length(blocks -> 'items') <= 50));
alter table public.bio_pages add column if not exists appearance jsonb not null default '{}' check (jsonb_typeof(appearance) = 'object');
alter table public.bio_pages add column if not exists seo_title text not null default '' check (char_length(seo_title) <= 70);
alter table public.bio_pages add column if not exists seo_description text not null default '' check (char_length(seo_description) <= 200);
alter table public.bio_pages add column if not exists share_media_id uuid references public.media on delete set null;
alter table public.bio_pages add column if not exists badge boolean not null default true;

-- Carry existing pages over. Each link becomes a link block that keeps its short-link code, so the page reads the same
-- and its clicks keep counting; "show latest posts" becomes a posts block at the end; the theme moves into the look.
-- fromLegacy() in src/lib/bioBlocks.ts reads old rows the same way (same ids), covered by tests/bio.test.ts.
update public.bio_pages p
set blocks = jsonb_build_object('v', 1, 'items',
      coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', 'm' || lpad(t.n::text, 3, '0'), 'type', 'link', 'label', left(btrim(t.l ->> 'label'), 80), 'url', t.l ->> 'url',
                 'thumb', null, 'start', null, 'end', null, 'code', t.l ->> 'code') order by t.n)
        from jsonb_array_elements(p.links) with ordinality as t(l, n)
        where coalesce(t.l ->> 'url', '') ~ '^https?://' and btrim(coalesce(t.l ->> 'label', '')) <> ''
      ), '[]'::jsonb)
      || case when p.show_posts then '[{"id": "mposts", "type": "posts", "count": 6, "links": {}}]'::jsonb else '[]'::jsonb end),
    appearance = case when p.appearance = '{}'::jsonb then jsonb_build_object('theme', p.theme) else p.appearance end
where p.blocks is null;

-- Short links a page's blocks own: clicks on them also count for that page and block (`item`: the block id, or the block
-- id and the network for a social icon). The composer never reuses them for posts (shorten() skips page_id rows).
alter table public.links add column if not exists page_id uuid references public.bio_pages on delete set null;
alter table public.links add column if not exists item text check (item is null or item ~ '^[A-Za-z0-9._:-]{1,64}$');
create index if not exists links_page on public.links (page_id) where page_id is not null;

-- Old pages shared short links with posts (the same long link reused one code). A carried-over code becomes the page's
-- own only when no post uses it and no other page does, so a post's clicks are never counted as the page's. The rest
-- get their own code the first time the page is saved.
with used as (
  select distinct m[1] as code from public.posts, regexp_matches(posts.text, '/l/([A-Za-z0-9]{6,12})', 'g') as m where posts.text like '%/l/%'
  union
  select distinct m[1] from public.post_targets, regexp_matches(post_targets.text, '/l/([A-Za-z0-9]{6,12})', 'g') as m where post_targets.text like '%/l/%'
),
bio as (
  select p.id as page_id, p.workspace_id, b ->> 'id' as item, b ->> 'code' as code
  from public.bio_pages p, jsonb_array_elements(p.blocks -> 'items') as b
  where b ->> 'type' = 'link' and b ->> 'code' is not null
),
solo as (select code from bio group by code having count(*) = 1)
update public.links k
set page_id = bio.page_id, item = bio.item
from bio
where k.code = bio.code and k.workspace_id = bio.workspace_id and k.page_id is null
  and bio.code in (select code from solo)
  and not exists (select 1 from used where used.code = k.code);

-- A page's numbers per day (UTC): views, clicks, views by referring host ({"instagram.com": 12}, at most 50 hosts a
-- day, the rest under "other"; direct visits are views minus these) and clicks by item ({"<block id>": 3}).
create table if not exists public.bio_views (
  page_id uuid not null references public.bio_pages on delete cascade,
  day date not null,
  views int not null default 0,
  clicks int not null default 0,
  referrers jsonb not null default '{}' check (jsonb_typeof(referrers) = 'object'),
  items jsonb not null default '{}' check (jsonb_typeof(items) = 'object'),
  primary key (page_id, day)
);
alter table public.bio_views enable row level security;
drop policy if exists read_bio_views on public.bio_views;
create policy read_bio_views on public.bio_views for select to authenticated
  using (exists (select 1 from public.bio_pages p where p.id = page_id and public.sees_brand(p.workspace_id, p.brand_id)));
revoke all on public.bio_views from anon;
grant select on public.bio_views to authenticated;
grant all on public.bio_views to service_role;

-- Who was counted in the last half hour, so a visitor counts at most once per page per 30 minutes. `visitor` is a
-- salted hash of IP, browser and day made by the app (src/lib/bioViews.ts); no IP is ever stored. Rows older than two
-- hours are useless (the key changes daily, and an old row is overwritten anyway) and are cleared as views come in.
-- Server only.
create table if not exists public.bio_visits (
  page_id uuid not null references public.bio_pages on delete cascade,
  visitor text not null check (char_length(visitor) between 16 and 64),
  seen_at timestamptz not null default now(),
  primary key (page_id, visitor)
);
create index if not exists bio_visits_seen on public.bio_visits (seen_at);
alter table public.bio_visits enable row level security;
revoke all on public.bio_visits from anon, authenticated;
grant all on public.bio_visits to service_role;

-- Count a view: only when this visitor has none counted on this page in the last 30 minutes (the insert, or the update
-- of a row old enough, is what decides; two servers at once can't both win). Returns whether it counted.
create or replace function public.bio_view(p_page uuid, p_visitor text, p_ref text) returns boolean
language plpgsql security definer set search_path = public as $$
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

-- Count a click for a page and item: a short link's (link_open) or a latest-posts tile's (/b/<slug>/p/...).
create or replace function public.bio_click(p_page uuid, p_item text) returns void
language sql security definer set search_path = public as $$
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

-- A short link's click: the link's own total as before (link_click), and, for a person on a page's own link, the
-- page's count too. Counting for the page can never stop the visitor from getting where they're going.
create or replace function public.link_open(p_code text, p_human boolean) returns text
language plpgsql security definer set search_path = public as $$
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

revoke all on function public.bio_view(uuid, text, text) from public, anon, authenticated;
revoke all on function public.bio_click(uuid, text) from public, anon, authenticated;
revoke all on function public.link_open(text, boolean) from public, anon, authenticated;
grant execute on function public.bio_view(uuid, text, text) to service_role;
grant execute on function public.bio_click(uuid, text) to service_role;
grant execute on function public.link_open(text, boolean) to service_role;
