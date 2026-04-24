-- Add updated_at to leads (needed for stuck-lead detection in cron)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Index for cron performance: find queued leads fast
CREATE INDEX IF NOT EXISTS leads_signal_status_created_idx
  ON leads (signal_status, created_at);

-- Atomic claim function: marks next N queued leads as 'processing' and returns them.
-- Called by the cron to prevent double-processing across concurrent executions.
CREATE OR REPLACE FUNCTION claim_queued_leads(batch_size integer)
RETURNS SETOF leads
LANGUAGE sql
AS $$
  UPDATE leads
  SET signal_status = 'processing', updated_at = now()
  WHERE id IN (
    SELECT id FROM leads
    WHERE signal_status = 'queued'
    ORDER BY created_at
    LIMIT batch_size
  )
  RETURNING *;
$$;
