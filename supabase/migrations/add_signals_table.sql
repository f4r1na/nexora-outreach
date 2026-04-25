-- Discrete per-signal rows extracted from leads.signal_data.
-- Additive: existing leads.signal_data writes are unchanged.

CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_url TEXT,
  date TEXT,
  date_iso TEXT,
  strength TEXT DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(lead_id, source, date_iso)
);

CREATE INDEX IF NOT EXISTS signals_lead_id_idx ON signals(lead_id);
CREATE INDEX IF NOT EXISTS signals_campaign_id_idx ON signals(campaign_id);

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signals for their campaigns"
  ON signals FOR SELECT
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));
