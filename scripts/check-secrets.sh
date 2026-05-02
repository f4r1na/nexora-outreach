#!/usr/bin/env bash
# Fail the build if any secrets are detected in source files.
# Run via: npm run prebuild

set -euo pipefail

SCAN_DIRS="app lib scripts"
FAIL=0

check() {
  local pattern="$1"
  local label="$2"
  local result
  result=$(grep -rEn "$pattern" $SCAN_DIRS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" 2>/dev/null || true)
  if [ -n "$result" ]; then
    echo "FAIL [$label] Potential secret detected:"
    echo "$result"
    FAIL=1
  fi
}

echo "Scanning for secrets..."

check 'sk-ant-[A-Za-z0-9_-]{20,}'        "Anthropic API key"
check 'sk_live_[A-Za-z0-9]{20,}'         "Stripe live secret key"
check 'rk_live_[A-Za-z0-9]{20,}'         "Stripe live restricted key"
check 'whsec_[A-Za-z0-9]{20,}'           "Stripe webhook secret"
check 're_[A-Za-z0-9]{20,}'              "Resend API key"
check 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{50,}' "Hardcoded JWT"

# Block service role key usage in non-server files (pages, components, hooks)
SERVICE_ROLE_IN_CLIENT=$(grep -rn "SUPABASE_SERVICE_ROLE_KEY" app/ --include="*.tsx" \
  | grep -v "app/api/" \
  | grep -v "app/actions/" \
  || true)
if [ -n "$SERVICE_ROLE_IN_CLIENT" ]; then
  echo "FAIL [Service role key in client component]:"
  echo "$SERVICE_ROLE_IN_CLIENT"
  FAIL=1
fi

if [ $FAIL -eq 1 ]; then
  echo ""
  echo "Build aborted: secret detected in source. Remove the value and rotate the key."
  exit 1
fi

echo "OK: no secrets detected in source files."
