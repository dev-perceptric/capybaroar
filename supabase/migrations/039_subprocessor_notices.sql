-- Notices sent before a new subprocessor starts (compliance/subprocessors.json, "starts"). One row per vendor and
-- start date, and one per address it went to, so a run that stops halfway picks up where it left off and nobody
-- gets the same notice twice. Server only.
create table if not exists public.subprocessor_notices (
  vendor_id text not null,
  starts date not null,
  created_at timestamptz not null default now(),
  done_at timestamptz,
  primary key (vendor_id, starts)
);
create table if not exists public.subprocessor_notice_sends (
  vendor_id text not null,
  starts date not null,
  email_hash text not null,
  sent_at timestamptz not null default now(),
  primary key (vendor_id, starts, email_hash),
  foreign key (vendor_id, starts) references public.subprocessor_notices on delete cascade
);
alter table public.subprocessor_notices enable row level security;
alter table public.subprocessor_notice_sends enable row level security;
revoke all on public.subprocessor_notices, public.subprocessor_notice_sends from anon, authenticated;
grant all on public.subprocessor_notices, public.subprocessor_notice_sends to service_role;
