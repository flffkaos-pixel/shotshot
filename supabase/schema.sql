-- ponytail: minimal schema. Supabase SQL editor에서 실행.
-- 1 project = free. 2+ projects = pro. Pro is checked via paypal_subscription_id presence.

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled project',
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_idx on projects(user_id, updated_at desc);

alter table projects enable row level security;

drop policy if exists "own projects" on projects;
create policy "own projects" on projects
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user payment state (1 row per user, kept in sync via PayPal webhook)
create table if not exists user_billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'lifetime')),
  paypal_subscription_id text,
  paypal_payer_id text,
  paypal_capture_id text,  -- ponytail: most recent capture, used for refunds
  paid_at timestamptz,
  expires_at timestamptz,
  warned_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists user_billing_expires_idx on user_billing(expires_at) where plan = 'pro';

alter table user_billing enable row level security;

drop policy if exists "read own billing" on user_billing;
create policy "read own billing" on user_billing
  for select using (auth.uid() = user_id);

-- service role bypasses RLS for webhook writes.

-- ponytail: payment ledger for refunds + accounting.
-- One row per successful capture. Capture ID comes from PayPal at /return.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paypal_order_id text,
  paypal_capture_id text,
  paypal_subscription_id text,
  amount text not null,
  currency text not null default 'USD',
  plan text not null check (plan in ('pro', 'lifetime')),
  refunded_at timestamptz,
  refunded_amount text,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_idx on payments(user_id, created_at desc);
create index if not exists payments_capture_idx on payments(paypal_capture_id) where paypal_capture_id is not null;
create index if not exists payments_sub_idx on payments(paypal_subscription_id) where paypal_subscription_id is not null;

alter table payments enable row level security;

drop policy if exists "read own payments" on payments;
create policy "read own payments" on payments
  for select using (auth.uid() = user_id);
