alter table auth.users add column if not exists stripe_customer_id text;

create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free',
  credits_used int default 0,
  credits_limit int default 10,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table subscriptions enable row level security;

create policy "Users own their subscription" on subscriptions
  for all using (auth.uid() = user_id);
