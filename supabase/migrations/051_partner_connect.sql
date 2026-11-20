-- White-label connect (src/lib/partnerConnectRules.ts): a partner (Morning Telos) shows its own connect page and sends
-- its customer straight to a network's sign-in, never to a Capybaroar page. POST /api/partner/brands/{id}/connect/start
-- makes a row here and answers the network's sign-in address; the network's callback finds the row by its state's hash,
-- connects the account to the brand and sends the person back to return_url (a host in PARTNER_RETURN_HOSTS). When
-- the network shares several Pages or accounts, the row also holds a pick for the partner API to finish.
--
-- Only hashes of the state and the pick token are kept. Each works once (used_at, picked_at) and for 30 minutes.
-- kept (the PKCE verifier) and pick_accounts (the network's tokens until the pick) are sealed with
-- "partner_connect:<id>" and re-sealed by scripts/rotate-token-key.mjs. Rows go a day after they're made (prune.ts).
-- Only the server reads this table: RLS on, no policies, no grants to anon or authenticated. Safe to run twice.
create table if not exists public.partner_connects (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces on delete cascade,
  brand_id uuid not null references public.brands on delete cascade,
  created_by uuid not null references auth.users on delete cascade,
  key_id uuid references public.api_keys on delete set null,
  network text not null,
  return_url text not null check (char_length(return_url) <= 2000),
  state_hash text not null unique,
  kept text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  pick_hash text unique,
  pick_accounts text,
  pick_expires_at timestamptz,
  picked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists partner_connects_brand on public.partner_connects (brand_id);
create index if not exists partner_connects_age on public.partner_connects (created_at);
alter table public.partner_connects enable row level security;
revoke all on public.partner_connects from anon, authenticated;
grant all on public.partner_connects to service_role;

notify pgrst, 'reload schema';
