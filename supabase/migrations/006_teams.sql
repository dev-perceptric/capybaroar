-- Phase 4: agencies and teams. A workspace (the agency) holds brands (its clients); channels and posts belong to a
-- brand. People join by email invite with a role (owner, admin, editor, client) and, optionally, only some brands.
-- A brand can require approval: an editor's post waits in `review` until an owner, admin or client approves it, in
-- the app or on the brand's review link. Every existing workspace gets one brand holding all its channels and posts.

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  color text not null default 'gray' check (color in ('gray', 'violet', 'green', 'amber', 'red', 'turquoise', 'sky', 'pink', 'yellow')),
  avatar text,
  needs_approval boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists brands_ws on public.brands (workspace_id, created_at);

alter table public.channels add column if not exists brand_id uuid references public.brands on delete set null;
create index if not exists channels_brand on public.channels (brand_id);
alter table public.posts add column if not exists brand_id uuid references public.brands on delete set null;
alter table public.posts add column if not exists submitted_by uuid references auth.users on delete set null;
create index if not exists posts_brand_calendar on public.posts (brand_id, publish_at);
-- The brand a channel being connected goes into (kept between the sign-in's two steps).
alter table public.oauth_states add column if not exists brand_id uuid references public.brands on delete set null;

-- Backfill: one brand per existing workspace, named after it, holding all its channels and posts.
insert into public.brands (workspace_id, name)
select w.id, left(w.name, 60) from public.workspaces w
where not exists (select 1 from public.brands b where b.workspace_id = w.id);
update public.channels c set brand_id = b.id from public.brands b where b.workspace_id = c.workspace_id and c.brand_id is null;
update public.posts p set brand_id = b.id from public.brands b where b.workspace_id = p.workspace_id and p.brand_id is null;

-- Posts waiting for approval. The publisher never publishes one (src/lib/publisher.ts, HELD).
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check check (status in ('draft', 'review', 'scheduled', 'publishing', 'published', 'partial', 'failed'));

-- Roles: clients see their brands' calendar and approve. brand_ids null means every brand.
alter table public.members drop constraint if exists members_role_check;
alter table public.members add constraint members_role_check check (role in ('owner', 'admin', 'editor', 'client'));
alter table public.members add column if not exists brand_ids uuid[];

-- Whether the signed-in user may see this brand's rows. A row with no brand is for members who see every brand.
create or replace function public.sees_brand(ws uuid, brand uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.members
    where workspace_id = ws and user_id = auth.uid() and (brand_ids is null or brand = any (brand_ids))
  )
$$;
revoke all on function public.sees_brand(uuid, uuid) from public, anon;
grant execute on function public.sees_brand(uuid, uuid) to authenticated, service_role;

-- Brand-limited members read only their brands' channels, posts and results.
drop policy if exists read_channels on public.channels;
create policy read_channels on public.channels for select to authenticated using (public.sees_brand(workspace_id, brand_id));
drop policy if exists read_posts on public.posts;
create policy read_posts on public.posts for select to authenticated using (public.sees_brand(workspace_id, brand_id));
drop policy if exists read_targets on public.post_targets;
create policy read_targets on public.post_targets for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and public.sees_brand(p.workspace_id, p.brand_id)));
drop policy if exists read_metrics on public.metrics;
create policy read_metrics on public.metrics for select to authenticated
  using (exists (select 1 from public.channels c where c.id = channel_id and public.sees_brand(c.workspace_id, c.brand_id)));
drop policy if exists read_post_metrics on public.post_metrics;
create policy read_post_metrics on public.post_metrics for select to authenticated
  using (exists (select 1 from public.channels c where c.id = channel_id and public.sees_brand(c.workspace_id, c.brand_id)));

alter table public.brands enable row level security;
create policy read_brands on public.brands for select to authenticated using (public.sees_brand(workspace_id, id));
grant select on public.brands to authenticated;
grant all on public.brands to service_role;

-- Email invites. Only the token's hash is looked up; the token itself is kept encrypted so the link can be copied
-- again while the invite is open. Server only.
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  email text not null check (char_length(email) between 3 and 320),
  role text not null check (role in ('admin', 'editor', 'client')),
  brand_ids uuid[],
  token_hash text not null unique,
  token text not null,
  invited_by uuid references auth.users on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists invites_ws on public.invites (workspace_id, created_at desc);
alter table public.invites enable row level security;
grant all on public.invites to service_role;

-- A brand's review link: anyone with it sees that brand's posts in review and approves or rejects them, no sign-in.
-- One per brand; revoking deletes it. Server only.
create table if not exists public.review_links (
  brand_id uuid primary key references public.brands on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  token_hash text not null unique,
  token text not null,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
alter table public.review_links enable row level security;
grant all on public.review_links to service_role;

-- Approval comments on a post (a rejection's reason). author is null for the review link; author_name says who.
create table if not exists public.post_comments (
  id bigserial primary key,
  post_id uuid not null references public.posts on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  author uuid references auth.users on delete set null,
  author_name text not null default '',
  kind text not null default 'comment' check (kind in ('comment', 'approved', 'rejected')),
  body text not null default '' check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post on public.post_comments (post_id, created_at);
alter table public.post_comments enable row level security;
create policy read_post_comments on public.post_comments for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and public.sees_brand(p.workspace_id, p.brand_id)));
grant select on public.post_comments to authenticated;
grant all on public.post_comments to service_role;
grant all on sequence public.post_comments_id_seq to service_role;
