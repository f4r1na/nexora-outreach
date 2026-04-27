-- Unsubscribe support on leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed    BOOLEAN    NOT NULL DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS leads_unsubscribed_idx
  ON leads (unsubscribed) WHERE unsubscribed = TRUE;

-- Compliance fields on subscriptions (CAN-SPAM sender identity requirement)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS company_name      TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS physical_address  TEXT;

-- Consent tracking on leads (GDPR/CASL audit trail)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_type     TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ;
