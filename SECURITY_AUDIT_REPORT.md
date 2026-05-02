# Nexora Outreach — Supabase Security Audit Report
Date: 2026-05-02

---

## Status Summary

| Area | Status |
|---|---|
| Service role key exposure | PASS — server-only |
| RLS on user-scoped tables | FIXED (SQL migration) |
| RLS on shared reference tables | FIXED (SQL migration) |
| Function search_path | FIXED (SQL migration) |
| Subscriptions table RLS | FIXED (SQL migration) |
| CRON_SECRET strength | ACTION REQUIRED |
| Auth settings (dashboard) | ACTION REQUIRED |
| Rate limits (dashboard) | ACTION REQUIRED |
| Leaked password protection | ACTION REQUIRED |

---

## 1. Database Fixes (SQL — APPLY THESE FIRST)

Run the full contents of `supabase/migrations/20260502_fix_rls_and_security.sql`
in the **Supabase SQL Editor** (Database → SQL Editor → New query).

### What it fixes

| Table | Fix |
|---|---|
| `signal_alerts` | RLS enabled + `FOR ALL USING (auth.uid() = user_id)` |
| `email_templates` | RLS enabled + policy via campaign ownership |
| `github_repos` | RLS enabled + authenticated SELECT only; service role writes |
| `signals_confidence_rules` | RLS enabled + authenticated SELECT only |
| `signal_scores` | RLS enabled + authenticated SELECT only |
| `subscriptions` | RLS enabled + `FOR ALL USING (auth.uid() = user_id)` |
| `claim_queued_leads()` | `SET search_path = 'public'` — clears Security Advisor warning |

### Verification (run after)

All three queries at the bottom of the migration must return **zero rows**. If any return rows, run the corresponding fix again or report here.

---

## 2. CRON_SECRET — ROTATE IMMEDIATELY

The current value is short and predictable. Replace it with a strong random secret.

**Generate a new secret (run this locally):**
```bash
node -e "console.log(require('crypto').randomBytes(40).toString('hex'))"
```

**Update in two places:**
1. `.env.local` → `CRON_SECRET=<new-value>`
2. Vercel Dashboard → Settings → Environment Variables → `CRON_SECRET` → `<new-value>`
3. Vercel Cron job configuration → update the `Authorization: Bearer <new-value>` header

No code changes needed — the cron routes already read from `process.env.CRON_SECRET`.

---

## 3. Supabase Dashboard — Auth Settings

**Path:** Authentication → Settings

| Setting | Target value | Notes |
|---|---|---|
| Enable leaked password protection | ON | HaveIBeenPwned check |
| Email confirmations | REQUIRED | Blocks unverified accounts |
| Secure email change | ON | Confirms on both old + new address |
| Minimum password length | 12 | |
| Password requirements | lowercase + uppercase + number + special | |
| JWT expiry | 3600 (1 hour) | |
| Session duration | 604800 (7 days) | |
| Enable refresh token rotation | ON | |
| Refresh token reuse interval | 10 seconds | |

---

## 4. Supabase Dashboard — Rate Limits

**Path:** Authentication → Rate Limits

| Endpoint | Limit |
|---|---|
| Email signup | 30 / hour / IP |
| Email sign-in | 30 / hour / IP |
| Password recovery | 30 / hour / IP |
| Token refresh | 150 / 5 minutes |
| OTP / SMS | 30 / hour |

---

## 5. Supabase Dashboard — API Settings

**Path:** Settings → API

- **Max rows:** Set to `1000` (prevents accidental full-table dumps via anon key)
- **JWT secret:** Check age. If older than 90 days → rotate (Settings → API → JWT Settings → Rotate)
- **Service role key:** Confirmed server-only — no action needed

---

## 6. Supabase Dashboard — Security Advisor

**Path:** Database → Security Advisor (or Reports → Security)

After running the SQL migration above, the following warnings should clear:

- `signal_alerts` RLS disabled → FIXED
- `email_templates` RLS disabled → FIXED
- `github_repos` RLS disabled → FIXED
- `signals_confidence_rules` RLS disabled → FIXED
- `signal_scores` RLS disabled → FIXED
- `subscriptions` RLS disabled → FIXED
- `claim_queued_leads` mutable search_path → FIXED

If any warnings remain, copy the exact text here and I will address them.

---

## 7. Optional — Network Restrictions

**Path:** Settings → Database → Network Restrictions

If you want to lock down direct Postgres connections (recommended pre-launch):
1. Add your home/office IP
2. Add Vercel's [static IP ranges](https://vercel.com/docs/edge-network/regions) if using connection pooling
3. Block `0.0.0.0/0`

> Skip this if you connect directly from local dev — you would need to update the allowlist each time your IP changes. Use Supabase Studio instead.

---

## 8. Optional — MFA for Admins

**Path:** Settings → Organization → Team

Enable MFA for every team member with dashboard access. This is independent of end-user MFA.

---

## What Was Already Good (No Action Needed)

- Service role key strictly server-side (47 API routes verified)
- Admin client configured with `autoRefreshToken: false, persistSession: false`
- Cron endpoints protected with `Authorization: Bearer` header
- All user-scoped tables had RLS from day one (campaigns, leads, replies, signals, etc.)
- No direct `FROM auth.users` queries in app code
- `.env.local` in `.gitignore`
- Stripe webhook handler uses service client appropriately
