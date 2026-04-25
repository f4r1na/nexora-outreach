-- Soft-discard for individual signals. UI uses this to hide a signal
-- without losing the row.

ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS discarded BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS signals_lead_id_active_idx
  ON signals(lead_id) WHERE discarded = FALSE;
