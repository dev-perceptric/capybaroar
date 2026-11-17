-- Devices each person has signed in on (src/lib/devices.ts): a random id in a cookie, never a fingerprint. A sign-in
-- on a device not seen before emails that person, unless it's their first. Server-only: RLS on, no policies, no
-- grants to anon or authenticated. Safe to run twice.

create table if not exists public.login_devices (
  user_id uuid not null references auth.users (id) on delete cascade,
  device text not null check (char_length(device) between 16 and 64),
  label text not null default '' check (char_length(label) <= 80),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (user_id, device)
);
alter table public.login_devices enable row level security;
revoke all on public.login_devices from anon, authenticated;
grant all on public.login_devices to service_role;

notify pgrst, 'reload schema';
