-- Phase 1: per-channel text and settings, alt text, posting queue, and alerts.

alter table public.post_targets add column if not exists text text;
alter table public.post_targets add column if not exists settings jsonb not null default '{}';
alter table public.post_targets add column if not exists note text;
alter table public.media add column if not exists alt text;
-- Saved time slots: [{ "day": 1, "time": "09:00" }] with day 0 = Sunday, in the workspace time zone.
alter table public.workspaces add column if not exists queue jsonb not null default '[]';
-- Values asked before sign-in (a Mastodon server) and kept between the two steps (its app id).
alter table public.oauth_states add column if not exists input jsonb not null default '{}';

-- Alerts already sent, so one failure sends one email.
create table if not exists public.alerts (
  id bigserial primary key,
  workspace_id uuid not null references public.workspaces on delete cascade,
  kind text not null check (kind in ('post_failed', 'reconnect')),
  ref text not null,
  sent_at timestamptz not null default now(),
  unique (kind, ref)
);
alter table public.alerts enable row level security;
grant all on public.alerts to service_role;
grant all on sequence public.alerts_id_seq to service_role;
