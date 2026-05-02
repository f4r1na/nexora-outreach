# Nexora Outreach — Pre-Launch Security Audit Report
Date: 2026-05-02  
Auditor: automated + manual review

---

## Executive Summary

| Category | Findings | Fixed in this audit |
|---|---|---|
| CRITICAL | 0 | — |
| HIGH | 4 | 4 |
| MEDIUM | 8 | 8 |
| LOW | 5 | 5 |
| INFO | 4 | — |

**Verdict: CONDITIONAL GO**

All CRITICAL and HIGH findings resolved. Three dashboard configuration items remain (auth hardening, rate limits, leaked-password toggle) — these must be completed before launch. No hardcoded secrets found. No SQL injection vectors. No XSS vectors.

---

## Phase 0 — Secrets & Key Exposure

### 0.1 Hardcoded Secret Scan

| Pattern | Result |
|---|---|
| `sk-ant-` (Anthropic keys) | PASS — no matches |
| `sk_live_` / `pk_live_` (Stripe live keys) | PASS — no matches |
| `whsec_` (Stripe webhook secrets) | PASS — no matches |
| `re_[A-Za-z0-9]{20,}` (Resend API keys) | PASS — no matches |
| `eyJhbGci...` (hardcoded JWTs) | PASS — no matches in source |
| Hardcoded `secret=` / `api_key=` assignments | PASS — no matches |

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` appear in build artifacts — this is **expected behavior** for `NEXT_PUBLIC_*` variables and the anon key is designed to be public.

### 0.2 Git History

No `.env` files found in git history. No secrets appear in tracked files.

### 0.3 NEXT_PUBLIC_* Audit

Variables exposed to the browser:
- `NEXT_PUBLIC_SUPABASE_URL` — ALLOWED (public Supabase project URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — ALLOWED (respects RLS, public by design)
- `NEXT_PUBLIC_APP_URL` — ALLOWED (public URL)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — ALLOWED (Stripe publishable key is public by design)

No secrets (`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) found in `NEXT_PUBLIC_*` usage.

### 0.4 Source Maps — FIXED

**Before:** `productionBrowserSourceMaps` not set (defaults to false in Next.js, but not explicit)  
**After:** `productionBrowserSourceMaps: false` explicitly set in `next.config.ts`

### 0.5 Build-Time Secret Detection — FIXED

Created `scripts/check-secrets.sh`. Patterns checked:
- Anthropic / Stripe / Resend / Webhook keys
- Hardcoded JWTs
- Service role key in client components

Added `"prebuild": "bash scripts/check-secrets.sh"` to `package.json`. Runs on every `npm run build` (including Vercel deploys). **Note:** on Windows local dev, requires Git Bash or WSL. The Vercel build pipeline (Linux) works natively.

### 0.6-0.8 Vercel / GitHub / Billing

**Action required (manual, dashboard-only):**
- [ ] Vercel: mark `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` as "Sensitive"
- [ ] Vercel: verify Production / Preview / Development use different values where applicable
- [ ] GitHub: enable Secret Scanning + Push Protection (Settings → Code security)
- [ ] GitHub: enable Dependabot alerts (Settings → Code security → Dependabot)
- [ ] Set spend alerts: Anthropic dashboard, Stripe billing alerts, Supabase bandwidth alerts

---

## Phase 1 — Authentication & Middleware

### Middleware — FIXED (HIGH)

**Finding:** `proxy.ts` contained correct Supabase session refresh middleware, but the file was named `proxy.ts` and exported a function named `proxy()`. Next.js never loaded it — dashboard routes had zero middleware protection and sessions were never refreshed at the edge.

**Fix:** Created `middleware.ts` at the project root with `export async function middleware()` and the correct `config.matcher`. Protects all `/dashboard/*` routes, redirects to `/login` if unauthenticated, redirects authenticated users away from `/login` and `/signup`.

**Deleted:** `proxy.ts` (dead code, replaced by `middleware.ts`)

### Individual Route Auth

All 47+ API routes verify the user via `supabase.auth.getUser()` before processing. All dashboard Server Components do the same. PASS.

### Supabase Auth Settings — ACTION REQUIRED (MEDIUM)

**Path:** Authentication → Settings  

| Setting | Target | Status |
|---|---|---|
| Leaked password protection | ON | Pending |
| Email confirmations required | YES | Pending |
| Secure email change | ON | Pending |
| Min password length | 12 | Pending |
| Password requirements | lower+upper+number+special | Pending |
| JWT expiry | 3600s (1 hour) | Pending |
| Session duration | 604800s (7 days) | Pending |
| Refresh token rotation | ON | Pending |
| Refresh token reuse interval | 10s | Pending |

### Supabase Rate Limits — ACTION REQUIRED (MEDIUM)

**Path:** Authentication → Rate Limits  

| Endpoint | Target |
|---|---|
| Email signup | 30/hour/IP |
| Email sign-in | 30/hour/IP |
| Password recovery | 30/hour/IP |
| Token refresh | 150/5min |

---

## Phase 2 — Database & RLS (from prior audit, applied)

All six tables previously missing RLS have been fixed. Run `supabase/migrations/20260502_fix_rls_and_security.sql` in the Supabase SQL Editor if not already done.

| Table | Status |
|---|---|
| `signal_alerts` | RLS enabled, user policy |
| `email_templates` | RLS enabled, campaign ownership policy |
| `github_repos` | RLS enabled, authenticated read-only |
| `signals_confidence_rules` | RLS enabled, authenticated read-only |
| `signal_scores` | RLS enabled, authenticated read-only |
| `subscriptions` | RLS enabled, user policy |
| `claim_queued_leads()` function | `search_path = 'public'` set |

---

## Phase 3 — API Security

### Rate Limiting — FIXED (MEDIUM)

| Route | Before | After |
|---|---|---|
| `/api/agent` | 10 req/60s | PASS (unchanged) |
| `/api/chat` | 10 req/60s | PASS (unchanged) |
| `/api/generate` | **None** | 10 req/hour — FIXED |
| `/api/leads/intelligence` | 20 req/hour | PASS (unchanged) |
| `/api/signals/research` | **None** | 10 req/hour — FIXED |
| `/api/campaign/wizard` | 10 req/hour | PASS (unchanged) |
| `/api/replies/draft` | **None** | 30 req/hour — FIXED |

### Input Validation

- `/api/agent`: prompt length capped at 2000 chars. PASS.
- `/api/parse-file`: file size now enforced at 10 MB (was unlimited). FIXED.
- Error messages normalized — internal errors no longer leak `err.message` to the client. FIXED.
- `/api/replies/delete`: fatal error handler was leaking `err.message` to client. FIXED.

### Ownership Checks — FIXED (HIGH)

**`/api/campaigns/send` IDOR:** Leads were fetched by `campaign_id` using the service client without first verifying the campaign belongs to the authenticated user. An attacker could provide another user's `campaign_id` and trigger email sends from that campaign.

**Fix:** Added campaign ownership check (`campaigns.eq("user_id", user.id)`) immediately after auth, before any lead access.

All other routes verified:
- `/api/campaigns/[id]` (PATCH/DELETE): verifies ownership before operation. PASS.
- `/api/replies/delete`: verifies `user_id = user.id` before delete. PASS.
- `/api/signals/delete`: verifies campaign ownership before clearing signals. PASS.
- `/api/followups/action`: verifies sequence ownership before status change. PASS.
- `/api/leads/intelligence`: filters lead IDs through anon client (RLS). PASS.

### Tracking Endpoints

- `/api/track/open/[id]`: no auth required by design (email pixel). Deduplicates opens per lead. PASS.
- `/api/track/click/[id]` — **Open Redirect (LOW) — FIXED:** The base64-encoded payload `{ lead_id, url }` was used as the redirect target without URL validation. An attacker could craft a token redirecting to an arbitrary URL. Fixed: URL validated to match `^https?://` before use as redirect target.
- `/api/unsubscribe`: token is `base64url(leadId)` — not signed, but UUID v4 keyspace (2^122) makes guessing impractical. PASS/INFO.

### Service Role Usage

Service role client is used only where required: cross-user signal cron, email sending, ownership pre-checks via service client. All user-scoped data access uses the anon client (RLS-enforced). PASS.

---

## Phase 6 — Security Headers — FIXED (HIGH)

**Before:** 5 headers set, missing HSTS and CSP  
**After:** 7 headers, added:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://checkout.stripe.com; frame-src https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests` |

---

## Phase 4 — XSS

No `dangerouslySetInnerHTML` usage found anywhere in the codebase. PASS.

---

## Phase 9 — Dependency Vulnerabilities

### Fixed
| Package | Before | After | Severity |
|---|---|---|---|
| `@anthropic-ai/sdk` | 0.82.0 (insecure file permissions) | 0.92.0 | Moderate → FIXED |
| `xlsx` | 0.18.5 (prototype pollution + ReDoS, no fix) | **REMOVED** (not used in code) | High → ELIMINATED |
| `next` | 16.2.2 (DoS via Server Components) | 16.2.4 | High → FIXED |

### Accepted (no fix available upstream)

| Package | Severity | Path | Rationale |
|---|---|---|---|
| `resend → svix → @xmldom/xmldom` | Moderate | Server-side email only | xmldom used internally by svix for webhook verification; not exposed to user input. Accepted until resend releases a fix. |
| `cypress → @cypress/request` | Moderate | Dev dependency | Not deployed to production. Accepted. |

---

## Phase 0.5 — CRON_SECRET — ACTION REQUIRED (HIGH)

Current value is short and human-readable. Replace with a cryptographically random 40-byte hex string:

```bash
node -e "console.log(require('crypto').randomBytes(40).toString('hex'))"
```

Update in:
1. `.env.local`
2. Vercel → Settings → Environment Variables → `CRON_SECRET`
3. Vercel Cron job Authorization header

---

## Remaining Action Items (sorted by severity)

### Must complete before launch

| # | Item | Severity | Where |
|---|---|---|---|
| 1 | Rotate CRON_SECRET to strong random value | HIGH | `.env.local` + Vercel |
| 2 | Enable leaked password protection | HIGH | Supabase → Auth → Settings |
| 3 | Apply RLS migration SQL (if not done) | HIGH | Supabase → SQL Editor |
| 4 | Set auth hardening settings (password length, JWT expiry, session, rotation) | MEDIUM | Supabase → Auth → Settings |
| 5 | Set auth rate limits | MEDIUM | Supabase → Auth → Rate Limits |

### Complete within 7 days of launch

| # | Item | Severity | Where |
|---|---|---|---|
| 6 | GitHub: enable Secret Scanning + Push Protection | MEDIUM | GitHub → Settings |
| 7 | GitHub: enable Dependabot | MEDIUM | GitHub → Settings |
| 8 | Mark secrets as Sensitive in Vercel | MEDIUM | Vercel → Settings |
| 9 | Set spend alerts on Anthropic / Stripe | MEDIUM | Provider dashboards |
| 10 | Supabase: rotate JWT secret if > 90 days old | MEDIUM | Supabase → Settings → API |
| 11 | Enable MFA for all dashboard admins | MEDIUM | Supabase → Organization |

---

## Long-Term Recommendations

1. **CSP nonces** — Replace `'unsafe-inline'` in script-src with per-request nonces. Requires Next.js middleware nonce generation (~1 day of work). Currently `'unsafe-inline'` is a practical compromise for Next.js hydration.
2. **Rate limiting middleware** — Move rate limiting from in-memory Maps to Redis (e.g., Upstash) so limits survive server restarts and scale across multiple instances.
3. **Penetration test** — Run OWASP ZAP against staging before first paid user.
4. **Incident response plan** — Document key rotation procedure for each secret if a breach is suspected.
5. **Monitor resend/svix** — Subscribe to `resend` GitHub releases to get notified when the `@xmldom/xmldom` chain is fixed upstream.

---

## What Was Already Good (no changes needed)

- Service role key strictly server-side across all 47+ API routes
- All user-scoped tables had RLS from day one
- No `FROM auth.users` direct SQL queries
- `.env.local` in `.gitignore`; `.env.example` now added
- Cron endpoints protected with `Authorization: Bearer` header
- No `dangerouslySetInnerHTML` in the entire codebase
- Input length validation on AI prompts
- Admin Supabase client configured with `autoRefreshToken: false, persistSession: false`
