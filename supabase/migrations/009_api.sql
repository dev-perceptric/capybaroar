-- API and MCP keys. A key lets an app or an AI agent act in one workspace as the person who made it: their role and
-- their brands, checked on every request, so a key stops working when that person leaves. Only a hash of the key is
-- kept; the key itself is shown once. Only the server reads this table.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  -- The start of the key, so people can tell their keys apart in the list.
  prefix text not null,
  hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists api_keys_ws on public.api_keys (workspace_id, created_at);

alter table public.api_keys enable row level security;
grant all on public.api_keys to service_role;
