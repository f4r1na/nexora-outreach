-- ============================================================
-- Creates all tables that exist in code but have no migration.
-- Also adds the subscription auto-creation trigger.
-- Safe to run on an existing DB — all statements use IF NOT EXISTS.
-- ============================================================

-- ── 1. style_profiles ───────────────────────────────────────────────────────
-- User's outreach style (product description, tone, key phrases).
-- Written by: dashboard/settings, ghostwriter page.
-- Read by:    generate API, ghostwriter page, export-data.
CREATE TABLE IF NOT EXISTS public.style_profiles (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  product_description TEXT,
  tone                TEXT,
  key_phrases         JSONB,
  avg_length          INT,
  style_summary       TEXT,
  tone_keywords       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own style profile" ON public.style_profiles;
CREATE POLICY "Users can manage own style profile"
  ON public.style_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 2. writing_styles ───────────────────────────────────────────────────────
-- Analyzed writing samples (ghostwriter feature).
-- Written by: ghostwriter/analyze API (upsert).
-- Read by:    generate API, followups/generate API, ghostwriter GET.
CREATE TABLE IF NOT EXISTS public.writing_styles (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  sample_emails JSONB,
  style_summary TEXT,
  tone_keywords TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.writing_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own writing style" ON public.writing_styles;
CREATE POLICY "Users can manage own writing style"
  ON public.writing_styles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 3. company_profiles ─────────────────────────────────────────────────────
-- User's company context (used to personalise AI generation).
-- Written by: /api/company-profile (upsert).
-- Read by:    agent, chat, campaign generation.
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name        TEXT,
  company_description TEXT,
  ideal_customer      TEXT,
  value_proposition   TEXT,
  tone                TEXT        NOT NULL DEFAULT 'Professional',
  website_url         TEXT,
  differentiators     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own company profile" ON public.company_profiles;
CREATE POLICY "Users can manage own company profile"
  ON public.company_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. follow_up_sequences ──────────────────────────────────────────────────
-- Per-campaign follow-up sequences (number of follow-ups, delay days).
-- Written by: /api/followups/generate.
-- Read by:    /api/followups/list, /api/followups/action.
CREATE TABLE IF NOT EXISTS public.follow_up_sequences (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      UUID        NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follow_up_number INT         NOT NULL DEFAULT 1,
  delay_days       INT         NOT NULL DEFAULT 3,
  status           TEXT        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fus_campaign_id_idx ON public.follow_up_sequences (campaign_id);
CREATE INDEX IF NOT EXISTS fus_user_id_idx     ON public.follow_up_sequences (user_id);

ALTER TABLE public.follow_up_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own follow-up sequences" ON public.follow_up_sequences;
CREATE POLICY "Users can manage own follow-up sequences"
  ON public.follow_up_sequences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 5. follow_up_emails ─────────────────────────────────────────────────────
-- Individual follow-up emails scheduled per lead per sequence.
-- Written by: /api/followups/generate, /api/followups/send (updates status).
CREATE TABLE IF NOT EXISTS public.follow_up_emails (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id      UUID        REFERENCES public.follow_up_sequences(id) ON DELETE CASCADE,
  lead_id          UUID        REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id      UUID        REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follow_up_number INT         NOT NULL DEFAULT 1,
  subject          TEXT,
  body             TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fue_sequence_id_idx ON public.follow_up_emails (sequence_id);
CREATE INDEX IF NOT EXISTS fue_lead_id_idx     ON public.follow_up_emails (lead_id);
CREATE INDEX IF NOT EXISTS fue_status_idx      ON public.follow_up_emails (status);

ALTER TABLE public.follow_up_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own follow-up emails" ON public.follow_up_emails;
CREATE POLICY "Users can manage own follow-up emails"
  ON public.follow_up_emails FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 6. campaign_iq_insights ─────────────────────────────────────────────────
-- AI-derived insights per campaign (what's working, what's not).
-- Written by: /api/campaign-iq/analyze.
-- Read by:    /api/campaign-iq/improve.
CREATE TABLE IF NOT EXISTS public.campaign_iq_insights (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id            UUID        NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  best_opening_style     TEXT,
  best_subject_pattern   TEXT,
  winning_signals        JSONB,
  losing_patterns        JSONB,
  improvement_suggestions JSONB,
  confidence_score       NUMERIC(5,2),
  reply_count_at_analysis INT,
  analyzed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ciq_user_campaign_idx
  ON public.campaign_iq_insights (user_id, campaign_id);

ALTER TABLE public.campaign_iq_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own campaign IQ" ON public.campaign_iq_insights;
CREATE POLICY "Users can manage own campaign IQ"
  ON public.campaign_iq_insights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 7. timing_triggers ──────────────────────────────────────────────────────
-- Signal-derived timing windows per lead ("send within N days of this event").
-- Written by: /api/timing/watch.
CREATE TABLE IF NOT EXISTS public.timing_triggers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id         UUID        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  trigger_type    TEXT        NOT NULL,
  trigger_data    JSONB,
  detected_at     TIMESTAMPTZ NOT NULL,
  optimal_send_by TIMESTAMPTZ NOT NULL,
  acted_on        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tt_user_id_idx      ON public.timing_triggers (user_id);
CREATE INDEX IF NOT EXISTS tt_lead_id_idx      ON public.timing_triggers (lead_id);
CREATE INDEX IF NOT EXISTS tt_acted_on_idx     ON public.timing_triggers (acted_on) WHERE acted_on = FALSE;
CREATE INDEX IF NOT EXISTS tt_optimal_send_idx ON public.timing_triggers (optimal_send_by);

ALTER TABLE public.timing_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own timing triggers" ON public.timing_triggers;
CREATE POLICY "Users can manage own timing triggers"
  ON public.timing_triggers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 8. Subscription auto-creation trigger ───────────────────────────────────
-- Creates a free-tier subscription row whenever a new user signs up.
-- Without this, users have no subscription row until their first campaign,
-- which causes the login redirect check (.single() returning null → /onboarding)
-- to fail for users who skip onboarding and go directly to settings/analytics.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, credits_limit, credits_used, sends_limit, sends_used)
  VALUES (NEW.id, 'free', 10, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Verification: run after applying.
-- Should return 0 rows if all tables exist.
-- ============================================================
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'style_profiles', 'writing_styles', 'company_profiles',
    'follow_up_sequences', 'follow_up_emails',
    'campaign_iq_insights', 'timing_triggers'
  )
ORDER BY tablename;
-- Expected: 7 rows

-- ============================================================
-- To identify any OLD tables not part of Nexora, run:
-- ============================================================
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    'campaigns', 'leads', 'subscriptions', 'gmail_connections',
    'email_events', 'replies', 'signals', 'signal_alerts',
    'signal_scores', 'signals_confidence_rules', 'github_repos',
    'style_profiles', 'writing_styles', 'company_profiles',
    'email_templates', 'follow_up_sequences', 'follow_up_emails',
    'campaign_iq_insights', 'timing_triggers', 'user_profiles'
  )
ORDER BY tablename;
-- Any rows returned here are candidates for deletion.
-- Review them before dropping.
