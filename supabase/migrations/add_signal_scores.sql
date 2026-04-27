-- Founder type on subscriptions (SaaS / agency / investor).
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS founder_type TEXT
  CHECK (founder_type IN ('saas', 'agency', 'investor'));

-- Proprietary scoring table: maps (founder_type, signal_type) → score + conversion_rate.
-- score is 1-10. conversion_rate is observed or benchmarked reply rate (%).
-- sample_size tracks whether the row is pre-seeded (0) or data-derived (N).
CREATE TABLE IF NOT EXISTS public.signal_scores (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_type     TEXT        NOT NULL CHECK (founder_type IN ('saas', 'agency', 'investor')),
  signal_type      TEXT        NOT NULL,
  score            INT         NOT NULL CHECK (score BETWEEN 1 AND 10),
  conversion_rate  NUMERIC(5,2) NOT NULL,
  sample_size      INT         NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ss_founder_signal_idx
  ON signal_scores (founder_type, signal_type);

-- Seed: industry benchmarks (sample_size = 0 = pre-seeded estimate).
-- SaaS founders respond best to technical signals (GitHub, tech upgrades).
-- Agency founders respond best to hiring/funding (companies that need help scaling).
-- Investor founders respond best to funding/news (deal flow signals).
INSERT INTO signal_scores (founder_type, signal_type, score, conversion_rate)
VALUES
  -- SaaS
  ('saas', 'GitHub',       9, 24.3),
  ('saas', 'tech_upgrade', 9, 24.3),
  ('saas', 'funding',      7, 21.7),
  ('saas', 'hiring',       6, 18.5),
  ('saas', 'product',      5,  9.8),
  ('saas', 'LinkedIn',     4,  8.4),
  ('saas', 'news',         3,  3.6),
  ('saas', 'research',     3,  3.1),
  ('saas', 'Twitter',      2,  3.2),
  -- Agency
  ('agency', 'hiring',       8, 22.1),
  ('agency', 'funding',      7, 20.4),
  ('agency', 'news',         5, 12.7),
  ('agency', 'LinkedIn',     6, 15.2),
  ('agency', 'product',      5, 11.3),
  ('agency', 'Twitter',      4,  8.9),
  ('agency', 'GitHub',       4,  9.8),
  ('agency', 'tech_upgrade', 4,  9.1),
  ('agency', 'research',     3,  5.4),
  -- Investor
  ('investor', 'funding',      9, 31.2),
  ('investor', 'research',     7, 19.4),
  ('investor', 'news',         7, 18.9),
  ('investor', 'hiring',       6, 16.3),
  ('investor', 'Twitter',      5, 13.4),
  ('investor', 'LinkedIn',     5, 12.1),
  ('investor', 'product',      4,  9.2),
  ('investor', 'GitHub',       3,  7.1),
  ('investor', 'tech_upgrade', 3,  6.8)
ON CONFLICT (founder_type, signal_type) DO NOTHING;
