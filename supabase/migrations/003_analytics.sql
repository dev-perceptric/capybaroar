-- Phase 2: results per published post, checked 1 hour, 1 day, 7 days and 30 days after it went out.
create table if not exists public.post_metrics (
  target_id uuid primary key references public.post_targets on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  channel_id uuid not null references public.channels on delete cascade,
  fetched_at timestamptz not null default now(),
  views int,
  reach int,
  impressions int,
  likes int,
  comments int,
  shares int,
  saves int,
  clicks int,
  engagement int generated always as (coalesce(likes, 0) + coalesce(comments, 0) + coalesce(shares, 0) + coalesce(saves, 0) + coalesce(clicks, 0)) stored
);
create index if not exists post_metrics_ws on public.post_metrics (workspace_id);
alter table public.post_metrics enable row level security;
create policy read_post_metrics on public.post_metrics for select to authenticated using (public.is_member(workspace_id));
grant select on public.post_metrics to authenticated;
grant all on public.post_metrics to service_role;
create index if not exists post_targets_published on public.post_targets (workspace_id, published_at) where status = 'published';
