-- OAuth for the MCP server, so Claude (and other MCP apps) can connect with a sign-in instead of a pasted key.
-- Apps register themselves (dynamic client registration), people approve them for one workspace, and the app gets a
-- short-lived access token plus a refresh token that changes on every use. Only hashes of codes and tokens are kept.
-- Only the server reads these tables.

create table if not exists public.oauth_clients (
  id text primary key,
  name text not null default 'MCP app' check (char_length(name) between 1 and 100),
  redirect_uris text[] not null,
  created_at timestamptz not null default now()
);

-- One approval: this app may act in this workspace as this person, until revoked.
create table if not exists public.oauth_grants (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.oauth_clients on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists oauth_grants_ws on public.oauth_grants (workspace_id, created_at);

-- Authorization codes: one use, ten minutes, tied to the PKCE challenge and the redirect address.
create table if not exists public.oauth_codes (
  hash text primary key,
  client_id text not null references public.oauth_clients on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  redirect_uri text not null,
  challenge text not null,
  resource text,
  expires_at timestamptz not null,
  used_at timestamptz
);

-- Token pairs. A refresh token works once: using it marks the pair rotated and makes a new pair. Using a rotated one
-- again means it leaked, so the whole grant is revoked.
create table if not exists public.oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references public.oauth_grants on delete cascade,
  access_hash text not null unique,
  refresh_hash text not null unique,
  access_expires_at timestamptz not null,
  refresh_expires_at timestamptz not null,
  rotated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists oauth_tokens_grant on public.oauth_tokens (grant_id);

alter table public.oauth_clients enable row level security;
alter table public.oauth_grants enable row level security;
alter table public.oauth_codes enable row level security;
alter table public.oauth_tokens enable row level security;
grant all on public.oauth_clients, public.oauth_grants, public.oauth_codes, public.oauth_tokens to service_role;
