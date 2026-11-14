-- People who asked for an email before a new subprocessor starts (capybaroar.com/subprocessors). Confirmed by email
-- first (double opt-in). The confirm link is stored only as a hash; the unsubscribe link is sealed so notices can
-- carry it, and found by its hash. Server only: no access for anon or authenticated.
create table if not exists public.subprocessor_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 254),
  confirm_hash text,
  confirmed_at timestamptz,
  unsub_hash text not null unique,
  unsub_sealed text not null,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists subprocessor_subscribers_confirm on public.subprocessor_subscribers (confirm_hash) where confirm_hash is not null;
alter table public.subprocessor_subscribers enable row level security;
revoke all on public.subprocessor_subscribers from anon, authenticated;
grant all on public.subprocessor_subscribers to service_role;
