-- ICP profile fields for signal velocity matching
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS icp_keywords TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS icp_location TEXT NOT NULL DEFAULT '';

-- Dedup table: one row per (user, source URL) to prevent duplicate alerts
CREATE TABLE IF NOT EXISTS public.signal_alerts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_url    TEXT        NOT NULL,
  source_type   TEXT        NOT NULL,
  company_name  TEXT        NOT NULL,
  signal_type   TEXT        NOT NULL,
  headline      TEXT        NOT NULL,
  published_at  TIMESTAMPTZ,
  alert_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, source_url)
);

CREATE INDEX IF NOT EXISTS sal_user_id_idx  ON signal_alerts (user_id);
CREATE INDEX IF NOT EXISTS sal_sent_at_idx  ON signal_alerts (alert_sent_at DESC);
