-- Which version of the Terms, Privacy Policy and DPA each person accepted, and when (compliance/policies.json holds
-- the current versions). One row per person, document and version; kept as proof of consent. Server only.
create table if not exists public.policy_acceptances (
  user_id uuid not null references auth.users on delete cascade,
  document text not null check (document in ('terms', 'privacy', 'dpa')),
  version text not null check (char_length(version) <= 40),
  source text not null check (source in ('signup', 'notice')),
  accepted_at timestamptz not null default now(),
  primary key (user_id, document, version)
);
alter table public.policy_acceptances enable row level security;
revoke all on public.policy_acceptances from anon, authenticated;
grant all on public.policy_acceptances to service_role;
