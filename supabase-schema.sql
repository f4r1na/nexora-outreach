create table campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  tone text default 'professional',
  status text default 'draft',
  lead_count int default 0,
  created_at timestamp with time zone default now()
);

create table leads (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references campaigns on delete cascade,
  first_name text,
  company text,
  role text,
  email text,
  custom_note text,
  generated_subject text,
  generated_body text,
  created_at timestamp with time zone default now()
);

alter table campaigns enable row level security;
alter table leads enable row level security;

create policy "Users own their campaigns" on campaigns
  for all using (auth.uid() = user_id);

create policy "Users own their leads" on leads
  for all using (
    campaign_id in (select id from campaigns where user_id = auth.uid())
  );
