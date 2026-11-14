-- Who did what in a workspace (Settings, Audit log). Written by the server only; nobody can change an event, and an
-- event can only be deleted once it's past its 365-day keep time, or with its workspace.
create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid references public.workspaces on delete cascade,
  actor_id uuid references auth.users on delete set null,
  actor_kind text not null check (actor_kind in ('user', 'api', 'app', 'review_link', 'system')),
  actor_label text check (char_length(actor_label) <= 200),
  action text not null check (action ~ '^[a-z_]+\.[a-z_]+$'),
  target_type text check (char_length(target_type) <= 40),
  target_id text check (char_length(target_id) <= 100),
  target_label text check (char_length(target_label) <= 200),
  meta jsonb not null default '{}' check (pg_column_size(meta) <= 4096),
  ip_hash text check (char_length(ip_hash) <= 64),
  created_at timestamptz not null default now()
);
create index if not exists audit_events_ws on public.audit_events (workspace_id, created_at desc);
create index if not exists audit_events_actor on public.audit_events (actor_id, created_at desc);
create index if not exists audit_events_age on public.audit_events (created_at);

create or replace function public.audit_events_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'audit events can''t be changed';
  end if;
  -- Deletes: past the keep time, or the workspace is gone (cascade from deleting it).
  if old.created_at < now() - interval '365 days' or old.workspace_id is null
     or not exists (select 1 from public.workspaces w where w.id = old.workspace_id) then
    return old;
  end if;
  raise exception 'audit events are kept for 365 days';
end $$;
drop trigger if exists audit_events_guard on public.audit_events;
create trigger audit_events_guard before update or delete on public.audit_events for each row execute function public.audit_events_guard();

alter table public.audit_events enable row level security;
revoke all on public.audit_events from anon, authenticated;
grant select, insert, delete on public.audit_events to service_role;
grant usage on sequence public.audit_events_id_seq to service_role;
