-- Cache GitHub package.json per repo to enable upgrade detection across checks.
CREATE TABLE IF NOT EXISTS public.github_repos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_url          TEXT NOT NULL UNIQUE,
  owner             TEXT NOT NULL,
  repo              TEXT NOT NULL,
  last_package_json JSONB,
  last_checked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure type and text exist on signals (may already be present in remote DB).
ALTER TABLE signals ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS text TEXT;
