-- Phase 5: agency reports. A report is a saved view of a brand's analytics (or every brand's) with a public link that
-- opens without signing in, and an optional weekly (Monday 9:00) or monthly (1st, 9:00) email in the workspace's time
-- zone. Only the link token's hash is looked up; the token itself is kept encrypted so the link can be copied again.
-- Written only by the server (service role); members read their workspace's reports for the brands they may see.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  -- null is every brand.
  brand_id uuid references public.brands on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  range_days text not null default '30' check (range_days in ('7', '30', '90', 'last_month')),
  -- Which blocks the report shows, in order: summary, growth, top, best, formats, channels, notes.
  sections jsonb not null default '["summary", "growth", "top", "best", "formats", "channels"]' check (jsonb_typeof(sections) = 'array'),
  notes text not null default '' check (char_length(notes) <= 5000),
  schedule text not null default 'none' check (schedule in ('none', 'weekly', 'monthly')),
  send_to text[] not null default '{}' check (cardinality(send_to) <= 20),
  -- The period ("w:2026-11-02", "m:2026-11") whose email was queued. Moving it is the claim that keeps two servers
  -- from both queueing one (queue_report).
  queued_period text,
  -- Set only when an email went out.
  last_sent_at timestamptz,
  token_hash text not null unique,
  token text not null,
  -- White label (Agency): the agency's logo from the media library and its color.
  logo_media_id uuid references public.media on delete set null,
  accent text check (accent ~ '^#[0-9a-fA-F]{6}$'),
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists reports_ws on public.reports (workspace_id, created_at);
-- Hourly upkeep: reports with a schedule.
create index if not exists reports_scheduled on public.reports (schedule) where schedule <> 'none';

alter table public.reports enable row level security;
create policy read_reports on public.reports for select to authenticated using (public.sees_brand(workspace_id, brand_id));
-- The token columns stay server-only.
grant select (id, workspace_id, brand_id, name, range_days, sections, notes, schedule, send_to, last_sent_at, logo_media_id, accent, created_by, created_at)
  on public.reports to authenticated;
grant all on public.reports to service_role;

-- Queue one period's email: move queued_period from what the caller saw to the new period and add the job, in one
-- transaction. A second server that saw the same old value updates no row (the first one's write is re-checked under
-- the row lock), so it adds no job.
create or replace function public.queue_report(report uuid, seen text, period text, due timestamptz) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.reports set queued_period = period where id = report and queued_period is not distinct from seen;
  if not found then
    return false;
  end if;
  insert into public.jobs (kind, payload) values ('report', jsonb_build_object('reportId', report, 'period', period, 'at', due));
  return true;
end
$$;
revoke all on function public.queue_report(uuid, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.queue_report(uuid, text, text, timestamptz) to service_role;
