-- Data exports (GDPR): "Download my data" for anyone, "Export workspace" for owners. A "data_export" job builds the
-- ZIP and uploads it to the private "exports" bucket; the emailed link works for 24 hours, then the hourly prune
-- deletes the file and its row (src/lib/exportRules.ts, src/lib/exports.ts).

create table if not exists public.data_exports (
  id uuid primary key default gen_random_uuid(),
  -- Kept when the workspace or person goes, so the prune still finds the file to delete.
  workspace_id uuid references public.workspaces on delete set null,
  user_id uuid references auth.users on delete set null,
  kind text not null check (kind in ('account', 'workspace')),
  status text not null default 'queued' check (status in ('queued', 'running', 'ready', 'failed')),
  path text check (char_length(path) <= 300),
  size bigint check (size is null or size >= 0),
  error text check (char_length(error) <= 500),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create index if not exists data_exports_user on public.data_exports (user_id, kind, created_at desc);
create index if not exists data_exports_expires on public.data_exports (expires_at) where expires_at is not null;
create index if not exists data_exports_open on public.data_exports (created_at) where status in ('queued', 'running', 'failed');
-- Server only: the app checks who may see an export before reading it.
alter table public.data_exports enable row level security;
grant all on public.data_exports to service_role;

-- The ZIPs: private, read only through signed links the server makes for the export's owner.
insert into storage.buckets (id, name, public) values ('exports', 'exports', false) on conflict (id) do nothing;
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'allowed_mime_types') then
    update storage.buckets
      set public = false,
          allowed_mime_types = array['application/zip'],
          file_size_limit = 20::bigint * 1024 * 1024 * 1024
      where id = 'exports';
  end if;
end $$;

-- Exports can run for minutes (gigabytes of media): they have their own claim and loop, so they never hold up a post
-- that's due. claim_jobs leaves them out, like Inbox reads.
create or replace function public.claim_jobs(worker text, n int) returns setof public.jobs
language sql security definer set search_path = public as $$
  update public.jobs set locked_at = now(), locked_by = worker, attempts = attempts + 1
  where id in (
    select id from public.jobs
    where done_at is null and run_after <= now() and attempts < max_attempts and kind not in ('inbox', 'data_export')
      and (locked_at is null or locked_at < now() - interval '10 minutes')
    order by run_after
    limit n
    for update skip locked
  )
  returning *
$$;

create or replace function public.claim_export_jobs(worker text, n int) returns setof public.jobs
language sql security definer set search_path = public as $$
  update public.jobs set locked_at = now(), locked_by = worker, attempts = attempts + 1
  where id in (
    select id from public.jobs
    where done_at is null and run_after <= now() and attempts < max_attempts and kind = 'data_export'
      and (locked_at is null or locked_at < now() - interval '10 minutes')
    order by run_after
    limit n
    for update skip locked
  )
  returning *
$$;
revoke all on function public.claim_jobs(text, int) from public, anon, authenticated;
grant execute on function public.claim_jobs(text, int) to service_role;
revoke all on function public.claim_export_jobs(text, int) from public, anon, authenticated;
grant execute on function public.claim_export_jobs(text, int) to service_role;

notify pgrst, 'reload schema';
