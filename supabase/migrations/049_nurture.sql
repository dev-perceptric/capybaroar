-- Getting-started emails (src/lib/nurture.ts): a short run of emails in a new workspace's first weeks, sent to the
-- person who made it.
--   members.tips  each person can turn them off (Settings, Your account, or the link in each email)
--   nurture_log   which step went to whom, so nothing sends twice; only the server reads and writes it
--   last_seen     when a person last used the app, from their newest sign-in session; the server only
-- Safe to run twice.

alter table public.members add column if not exists tips boolean not null default true;

create table if not exists public.nurture_log (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null,
  step text not null,
  period text not null default 'once',
  sent_at timestamptz not null default now(),
  primary key (workspace_id, user_id, step, period)
);
alter table public.nurture_log enable row level security;

create or replace function public.last_seen(p_user uuid) returns timestamptz
language sql stable security definer set search_path = '' as $fn$
  select max(coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at)) from auth.sessions s where s.user_id = p_user;
$fn$;
revoke execute on function public.last_seen(uuid) from public, anon, authenticated;
grant execute on function public.last_seen(uuid) to service_role;
