-- email_templates: AI-generated tone variants per campaign.
-- Rows are deleted and re-created each time the user hits "generate templates".
-- reply_count / sample_size are incremented by future reply-detection logic.
CREATE TABLE IF NOT EXISTS public.email_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  signal_type   TEXT        NOT NULL DEFAULT 'general',
  tone          TEXT        NOT NULL,
  subject       TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  reply_count   INT         NOT NULL DEFAULT 0,
  sample_size   INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS et_campaign_id_idx ON email_templates (campaign_id);

-- selected_template_id is intentionally not an FK to avoid circular reference
-- (email_templates.campaign_id → campaigns.id and campaigns.selected_template_id → email_templates.id).
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS selected_template_id UUID,
  ADD COLUMN IF NOT EXISTS selected_subject_line TEXT;
