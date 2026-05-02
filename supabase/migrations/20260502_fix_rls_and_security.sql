-- ============================================================
-- Security hardening: RLS + function search_path
-- Apply via Supabase SQL Editor
-- ============================================================

-- 1. signal_alerts — user-scoped table created without RLS
ALTER TABLE public.signal_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own alerts" ON public.signal_alerts;
CREATE POLICY "Users can manage own alerts"
  ON public.signal_alerts
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. email_templates — inherits ownership through campaigns
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own campaign templates" ON public.email_templates;
CREATE POLICY "Users can manage own campaign templates"
  ON public.email_templates
  FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE user_id = auth.uid()
    )
  );

-- 3. github_repos — shared cache; authenticated read only, writes via service role only
ALTER TABLE public.github_repos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read github cache" ON public.github_repos;
CREATE POLICY "Authenticated users can read github cache"
  ON public.github_repos
  FOR SELECT
  USING (auth.role() = 'authenticated');
-- No INSERT/UPDATE/DELETE policy: service role (bypasses RLS) handles all writes

-- 4. signals_confidence_rules — shared reference data; read-only
ALTER TABLE public.signals_confidence_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read confidence rules" ON public.signals_confidence_rules;
CREATE POLICY "Authenticated users can read confidence rules"
  ON public.signals_confidence_rules
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5. signal_scores — shared reference data; read-only
ALTER TABLE public.signal_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read signal scores" ON public.signal_scores;
CREATE POLICY "Authenticated users can read signal scores"
  ON public.signal_scores
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 6. subscriptions — verify RLS (created outside tracked migrations)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own subscription" ON public.subscriptions;
CREATE POLICY "Users can manage own subscription"
  ON public.subscriptions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. claim_queued_leads — fix mutable search_path (Supabase Security Advisor warning)
--    Setting search_path = 'public' keeps unqualified table refs working
--    while removing the exploitable pg_temp from the path
ALTER FUNCTION public.claim_queued_leads(integer) SET search_path = 'public';

-- ============================================================
-- Verification — run these after applying the block above.
-- All three queries must return zero rows.
-- ============================================================

-- A. Tables with RLS still disabled:
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- B. Tables with no policies at all:
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p
  ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' AND p.policyname IS NULL;

-- C. Function search_path confirmed:
SELECT proname, proconfig
FROM pg_proc
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE nspname = 'public' AND proname = 'claim_queued_leads';
-- proconfig should include 'search_path=public'
