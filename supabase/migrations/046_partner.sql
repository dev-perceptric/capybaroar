-- The partner API (src/app/api/partner): another product (Morning Telos) makes a brand for each of its customers in its
-- own Capybaroar workspace, gives that customer's AI agents a key that sees only that one brand, and sends the customer
-- a one-time link to connect their social accounts without a Capybaroar account. Safe to run twice.

-- Keys now have a kind:
-- - member  "cbr_..."         acts as the person who made it (009), as before.
-- - partner "cb_partner_..."  works only on /api/partner, only on brands made through it (external_id set).
-- - brand   "cbr_brand_..."   works on /api/v1 and MCP as an editor limited to brand_id.
-- Partner and brand keys keep user_id: the owner or admin who made the partner key. Posts, files and the audit log
-- need a real person, and the keys stop working when that person leaves or stops being an owner or admin, like
-- member keys do.
alter table public.api_keys add column if not exists kind text not null default 'member';
alter table public.api_keys drop constraint if exists api_keys_kind_check;
alter table public.api_keys add constraint api_keys_kind_check check (kind in ('member', 'partner', 'brand'));
-- Deleting a brand deletes its keys.
alter table public.api_keys add column if not exists brand_id uuid references public.brands on delete cascade;
alter table public.api_keys drop constraint if exists api_keys_brand_check;
alter table public.api_keys add constraint api_keys_brand_check check ((kind = 'brand') = (brand_id is not null));
create index if not exists api_keys_brand on public.api_keys (brand_id) where brand_id is not null;

-- The partner's own id for a brand (Morning Telos sends its workspace id). Set only on brands the partner API made;
-- a second create with the same id returns the same brand.
alter table public.brands add column if not exists external_id text check (external_id is null or char_length(external_id) between 1 and 200);
create unique index if not exists brands_external on public.brands (workspace_id, external_id) where external_id is not null;

-- AI files belong to the brand they were made for, so a brand key sees its own and no other brand's.
alter table public.generations add column if not exists brand_id uuid references public.brands on delete set null;

-- The partner's webhook is a row in webhooks (020) with kind 'partner', so it uses the same deliveries table, retries
-- and turning off. It gets channel.connected and channel.lost for partner brands, signed the Standard Webhooks way
-- (webhook-id, webhook-timestamp, webhook-signature). One per workspace; Settings and the webhook tools don't list it.
alter table public.webhooks add column if not exists kind text not null default 'workspace';
alter table public.webhooks drop constraint if exists webhooks_kind_check;
alter table public.webhooks add constraint webhooks_kind_check check (kind in ('workspace', 'partner'));
create unique index if not exists webhooks_partner_one on public.webhooks (workspace_id) where kind = 'partner';

-- Connect links: a page, opened without signing in, that connects channels to one brand. Only the token's hash is
-- kept. The first browser to press Start claims it (browser_hash: the hash of a secret in that browser's cookie);
-- no other browser can use it after that. It ends when the person presses Done (ended_at) or 24 hours after it was
-- made. Only the server reads this table.
create table if not exists public.connect_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  brand_id uuid not null references public.brands on delete cascade,
  created_by uuid not null references auth.users on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  browser_hash text,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists connect_links_brand on public.connect_links (brand_id);
create index if not exists connect_links_expires on public.connect_links (expires_at);
alter table public.connect_links enable row level security;
grant all on public.connect_links to service_role;

-- A sign-in started from a connect link finishes without a Capybaroar session: the callback checks the link instead.
alter table public.oauth_states add column if not exists connect_link_id uuid references public.connect_links on delete cascade;

notify pgrst, 'reload schema';
