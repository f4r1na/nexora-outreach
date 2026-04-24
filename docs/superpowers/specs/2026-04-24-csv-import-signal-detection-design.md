# CSV Import + Signal Detection Design

**Date:** 2026-04-24
**Status:** Approved

## Overview

Allow users to upload a CSV of leads (first_name, last_name, email, company, title) to create a campaign. Signals are detected automatically in the background via Vercel Cron. User reviews signals, then triggers email generation.

## User Flow

1. User clicks "Import CSV" from campaigns list
2. `/dashboard/campaigns/import` - drag-and-drop upload zone, column preview (first 5 rows), confirm button
3. Confirm: `POST /api/campaigns/import` - parses CSV, creates campaign + bulk-inserts leads with `signal_status = 'queued'`, returns `{ campaignId }`
4. Redirect to `/dashboard/campaigns/[id]?tab=leads`
5. Leads tab shows processing banner: "Detecting signals... 243 / 5,000 leads analyzed" with progress bar, polling every 5s
6. Once all leads processed: banner becomes "Signals ready", leads show signal chips
7. User clicks "Generate emails" - uses existing email generation flow

## Architecture

### New API Routes

- `POST /api/campaigns/import` - parse CSV, create campaign + leads
- `GET /api/campaigns/[id]/signals/progress` - returns `{ total, queued, processing, done, failed }`
- `POST /api/signals/cron` - Vercel Cron endpoint, protected by `Authorization: Bearer $CRON_SECRET`

### Cron Logic (every minute)

1. Reset stuck leads: `signal_status = 'processing'` and `updated_at < now - 5min` → reset to `'queued'`
2. Atomically claim next 150 leads via SQL UPDATE ... WHERE id IN (SELECT ... LIMIT 150) RETURNING *
3. Process in batches of 15 concurrent Claude Haiku calls (same prompt as `/api/signals/research`)
4. Write `signal_data` + `signal_status = 'done'` or `'failed'` per lead
5. Deduct credits in bulk (1 credit per successful lead)

**Throughput:** 150 leads/min, 15 concurrent Claude calls, ~20s actual work per run. 5,000 leads = ~33 minutes.

### vercel.json

```json
{
  "crons": [{ "path": "/api/signals/cron", "schedule": "* * * * *" }]
}
```

### Environment Variables

- `CRON_SECRET` - used to protect the cron endpoint

## Database

No new tables. Uses existing `leads` columns: `signal_status`, `signal_data`.

**Migration needed:**
```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
CREATE INDEX IF NOT EXISTS leads_signal_status_idx ON leads (signal_status, created_at);
```

**Lead insert shape:**
```ts
{
  campaign_id,
  user_id,
  first_name: "First Last",  // last_name concatenated in
  email,
  company,
  role,                       // mapped from CSV 'title' column
  signal_status: 'queued',
}
```

**Progress query:**
```sql
SELECT
  COUNT(*) FILTER (WHERE signal_status = 'queued')     AS queued,
  COUNT(*) FILTER (WHERE signal_status = 'processing') AS processing,
  COUNT(*) FILTER (WHERE signal_status = 'done')       AS done,
  COUNT(*) FILTER (WHERE signal_status = 'failed')     AS failed,
  COUNT(*)                                              AS total
FROM leads WHERE campaign_id = $1
```

## Frontend Components

### New: `/dashboard/campaigns/import/page.tsx`

- Client component
- State 1 - Upload zone: click-to-browse or drag-and-drop, `.csv` only
- State 2 - Preview: table of first 5 rows, detected columns, error if `email` column missing
- Confirm button: `POST /api/campaigns/import`, redirect to campaign on success

### Modified: `/dashboard/campaigns/page.tsx`

- Add "Import CSV" button alongside "New Campaign"

### New: `SignalProgressBanner` component

- Shown when any lead has `signal_status = 'queued'` or `'processing'`
- Polls `GET /api/campaigns/[id]/signals/progress` every 5s
- Progress bar + "Detecting signals... X / Y leads analyzed"
- On completion: "Signals ready" state with "Generate emails" CTA
- Auto-dismisses once all leads are done/failed

### Modified: `/dashboard/campaigns/[id]/_components/leads-tab.tsx`

- Render `SignalProgressBanner` at top when signals are in progress

## CSV Column Mapping

| CSV column | DB column | Notes |
|---|---|---|
| first_name | first_name | Combined as "first_name last_name" |
| last_name | (into first_name) | Concatenated, no schema change |
| email | email | Required - upload fails without it |
| company | company | Optional |
| title | role | Optional |

Column matching is case-insensitive. Extra columns are ignored.

## Plan/Credit Gating

- Signal detection is Pro/Agency only (same as existing `/api/signals/research`)
- Cron checks user's plan before processing each lead's campaign
- Credits deducted in bulk per cron run

## Error Handling

- CSV parse errors: returned to client before campaign is created
- Missing `email` column: blocked at preview step
- Lead-level signal failure: `signal_status = 'failed'`, does not block other leads
- Stuck leads: reset to `'queued'` after 5 minutes
