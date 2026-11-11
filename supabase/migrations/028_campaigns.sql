-- Campaigns: a name and a color that group posts (a launch, a sale, a season), to filter the calendar and see the
-- campaign's posts and results together. A campaign may belong to one brand, or to the whole workspace.
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  brand_id uuid references public.brands on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  tone text not null default 'violet',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists campaigns_ws on public.campaigns (workspace_id, created_at);
alter table public.campaigns enable row level security;
drop policy if exists read_campaigns on public.campaigns;
create policy read_campaigns on public.campaigns for select to authenticated using (public.is_member(workspace_id));
grant select on public.campaigns to authenticated;
grant all on public.campaigns to service_role;

alter table public.posts add column if not exists campaign_id uuid references public.campaigns on delete set null;
create index if not exists posts_campaign on public.posts (campaign_id) where campaign_id is not null;
