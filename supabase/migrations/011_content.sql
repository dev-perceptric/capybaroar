-- Phase 6: more ways to fill the calendar. RSS feeds that become posts, evergreen posts that go out again every few
-- weeks, and a link-in-bio page per brand. Bulk upload needs no table: it saves ordinary posts and media.

-- A brand's feeds. Every 30 minutes the upkeep reads each active feed once (the first server to move fetched_at
-- claims it), and items it hasn't seen become drafts or queued posts on the feed's channels.
create table if not exists public.feeds (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  brand_id uuid not null references public.brands on delete cascade,
  url text not null check (url ~ '^https?://' and char_length(url) <= 2000),
  title text not null default '' check (char_length(title) <= 200),
  channel_ids uuid[] not null default '{}',
  template text not null default '{title} {link}' check (char_length(template) between 1 and 1000),
  mode text not null default 'draft' check (mode in ('draft', 'queue')),
  -- Ids of the items already handled (the latest 300), and the newest one.
  seen text[] not null default '{}',
  last_item_guid text,
  active boolean not null default true,
  fetched_at timestamptz,
  error text,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  unique (brand_id, url)
);
create index if not exists feeds_ws on public.feeds (workspace_id, created_at);
-- The upkeep's pick: active feeds, least recently read first.
create index if not exists feeds_due on public.feeds (fetched_at nulls first) where active;
alter table public.feeds enable row level security;
create policy read_feeds on public.feeds for select to authenticated using (public.sees_brand(workspace_id, brand_id));
grant select on public.feeds to authenticated;
grant all on public.feeds to service_role;

-- A published post that goes out again every N weeks, as a copy in the queue. The upkeep claims a due row by moving
-- next_at forward only if it still holds the value it read, so two servers never both make a copy for one period.
create table if not exists public.evergreen (
  post_id uuid primary key references public.posts on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  every_weeks int not null check (every_weeks between 1 and 52),
  next_at timestamptz not null,
  last_at timestamptz,
  last_post_id uuid references public.posts on delete set null,
  error text,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists evergreen_due on public.evergreen (next_at);
create index if not exists evergreen_ws on public.evergreen (workspace_id);
alter table public.evergreen enable row level security;
create policy read_evergreen on public.evergreen for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and public.sees_brand(p.workspace_id, p.brand_id)));
grant select on public.evergreen to authenticated;
grant all on public.evergreen to service_role;

-- One link-in-bio page per brand, public at /b/<slug>. Links carry a short-link code (public.links) so their clicks
-- are counted; the page is read by the server with the service role, never by visitors directly.
create table if not exists public.bio_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  brand_id uuid not null unique references public.brands on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  title text not null default '' check (char_length(title) <= 80),
  bio text not null default '' check (char_length(bio) <= 300),
  avatar_media_id uuid references public.media on delete set null,
  -- [{ "label": "Shop", "url": "https://...", "code": "Ab3dEf9" }]
  links jsonb not null default '[]' check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 20),
  show_posts boolean not null default false,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists bio_pages_ws on public.bio_pages (workspace_id);
alter table public.bio_pages enable row level security;
create policy read_bio_pages on public.bio_pages for select to authenticated using (public.sees_brand(workspace_id, brand_id));
grant select on public.bio_pages to authenticated;
grant all on public.bio_pages to service_role;

-- The bio page's latest posts: a brand's newest published channel posts.
create index if not exists post_targets_published on public.post_targets (workspace_id, published_at desc) where status = 'published';
