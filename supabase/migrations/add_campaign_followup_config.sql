-- Per-campaign follow-up configuration
alter table campaigns
  add column if not exists follow_up_delays integer[] not null default '{3,5,7}',
  add column if not exists follow_ups_enabled boolean not null default true;
