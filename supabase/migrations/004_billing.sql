-- Billing: each workspace's plan and its Stripe subscription. Written only by the server (service role):
-- checkout, the billing portal and the Stripe webhook. New workspaces start with 14 days of Pro.

alter table public.workspaces
  add column plan text not null default 'free' check (plan in ('free', 'pro', 'agency')),
  add column plan_status text,
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column trial_ends_at timestamptz default (now() + interval '14 days'),
  add column current_period_end timestamptz;

-- Existing workspaces get the same 14 days from today (the column default already filled them in on add).
update public.workspaces set trial_ends_at = now() + interval '14 days';

create unique index workspaces_stripe_customer on public.workspaces (stripe_customer_id) where stripe_customer_id is not null;

-- Table grants already cover new columns (service_role all, authenticated select through read_ws).
grant select on public.workspaces to authenticated;
grant all on public.workspaces to service_role;
