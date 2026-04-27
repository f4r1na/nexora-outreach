-- Rules table: maps (signal_type, age bucket) → confidence level.
-- days_threshold is the UPPER bound (inclusive). Lookup finds the row with
-- the lowest days_threshold that is still >= the signal's actual age, so
-- rules must be ordered from most-specific (smallest bucket) to catch-all.
--
-- To re-derive conversion_rate from live data once enough volume exists:
--
--   SELECT
--     s.source                                                        AS signal_type,
--     COUNT(DISTINCT s.lead_id)                                       AS leads_with_signal,
--     COUNT(DISTINCT ee.lead_id)                                      AS replied_leads,
--     ROUND(
--       COUNT(DISTINCT ee.lead_id)::numeric /
--       NULLIF(COUNT(DISTINCT s.lead_id), 0) * 100, 1
--     )                                                               AS reply_rate_pct
--   FROM signals s
--   LEFT JOIN email_events ee
--          ON ee.lead_id = s.lead_id
--         AND ee.event_type = 'replied'
--   WHERE s.discarded = false
--   GROUP BY s.source
--   ORDER BY reply_rate_pct DESC NULLS LAST;

CREATE TABLE IF NOT EXISTS public.signals_confidence_rules (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type      TEXT        NOT NULL,
  days_threshold   INT         NOT NULL DEFAULT 9999,
  confidence_level TEXT        NOT NULL CHECK (confidence_level IN ('HIGH','MEDIUM','LOW')),
  conversion_rate  NUMERIC(5,2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique per (type, bucket) so re-running the migration is safe.
CREATE UNIQUE INDEX IF NOT EXISTS scr_type_days_idx
  ON signals_confidence_rules (signal_type, days_threshold);

-- Seed: values from cold-email intent-signal benchmarks.
-- GitHub / tech_upgrade: engineers evaluating a new major version are in a
--   research/buying mindset — highest observed reply rate.
INSERT INTO signals_confidence_rules (signal_type, days_threshold, confidence_level, conversion_rate)
VALUES
  ('GitHub',       9999, 'HIGH',   24.3),
  ('tech_upgrade', 9999, 'HIGH',   24.3),
  ('funding',      9999, 'HIGH',   21.7),
  ('hiring',          7, 'HIGH',   18.5),
  ('hiring',         30, 'MEDIUM', 11.2),
  ('hiring',       9999, 'LOW',     4.8),
  ('product',        14, 'MEDIUM',  9.8),
  ('product',      9999, 'LOW',     5.3),
  ('LinkedIn',       30, 'MEDIUM',  8.4),
  ('LinkedIn',     9999, 'LOW',     4.1),
  ('Twitter',      9999, 'LOW',     3.2),
  ('news',         9999, 'LOW',     3.6),
  ('research',     9999, 'LOW',     3.1),
  ('DEFAULT',      9999, 'MEDIUM',  7.0)
ON CONFLICT (signal_type, days_threshold) DO NOTHING;
