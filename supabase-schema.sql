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

-- AI Reply Handler
create table if not exists replies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  campaign_id uuid references campaigns(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  lead_email text not null,
  lead_name text,
  original_subject text,
  reply_body text not null,
  ai_draft text,
  status text default 'pending' check (status in ('pending', 'draft_ready', 'sent', 'skipped')),
  gmail_message_id text unique,
  gmail_thread_id text,
  created_at timestamptz default now()
);

alter table replies enable row level security;

create policy "Users can view own replies" on replies
  for select using (auth.uid() = user_id);

create policy "Users can insert own replies" on replies
  for insert with check (auth.uid() = user_id);

create policy "Users can update own replies" on replies
  for update using (auth.uid() = user_id);

-- Ghost Writer Mode
CREATE TABLE IF NOT EXISTS writing_styles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  sample_emails text[] NOT NULL DEFAULT '{}',
  style_summary text,
  tone_keywords text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE writing_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own style" ON writing_styles FOR ALL USING (auth.uid() = user_id);
