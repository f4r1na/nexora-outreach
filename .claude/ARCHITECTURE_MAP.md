# Architecture Map

## Stack
Next.js 16 App Router · TypeScript · Supabase · Stripe · Resend/Gmail API

## Directory Layout

```
app/
├── (auth)/              # Login, signup, forgot/reset password
├── _landing/            # Public landing page components
├── api/                 # Route handlers
│   ├── analytics/       # GET campaign stats
│   ├── campaigns/[id]/  # DELETE campaign
│   ├── generate/        # POST — AI email generation (OpenAI)
│   ├── ghostwriter/     # GET style summary, POST analyze style
│   ├── replies/         # GET, POST check/draft/send/delete/manual
│   ├── followups/       # list, action (pause/resume/cancel)
│   ├── signals/         # Lead research (Signal Radar)
│   ├── subscription/    # GET plan info
│   ├── export/          # CSV export
│   ├── stripe/          # checkout, webhook
│   └── track/           # open/click pixel tracking
├── dashboard/
│   ├── page.tsx         # Dashboard home
│   ├── layout.tsx       # Sidebar layout wrapper
│   ├── _components/     # sidebar.tsx
│   ├── campaigns/
│   │   ├── page.tsx     # Campaign list
│   │   ├── new/         # 3-step campaign wizard
│   │   └── [id]/        # Campaign detail (tabs: overview/leads/followups/analytics)
│   ├── inbox/           # Reply management
│   ├── analytics/       # Global analytics (Pro+)
│   ├── settings/        # Subscription, Gmail, writing style, plans
│   ├── ghostwriter/     # Writing style analyzer
│   └── signals/         # Lead research results
├── layout.tsx           # Root layout (fonts: Syne, Outfit)
└── globals.css          # CSS vars: --font-syne, --font-outfit, --black, --black-2

lib/
├── supabase/
│   ├── client.ts        # Browser client
│   └── server.ts        # Server client (createClient)
├── plans.ts             # PLANS const, PlanKey type, PLAN_CREDITS
└── stripe.ts            # Stripe SDK init

components/
└── upgrade-modal.tsx    # Reusable upgrade gate modal
```

## Key Patterns

### Auth
- `createClient()` from `lib/supabase/server` in every server component
- Always `if (!user) redirect("/login")` at top of dashboard pages

### Plans
- `free` (10 credits) · `starter` (300) · `pro` (1000) · `agency` (unlimited)
- Pro/Agency unlock: analytics, follow-ups, lead research, Gmail send
- Credits tracked in `subscriptions.credits_used` / `credits_limit`

### Database Tables
`campaigns` · `leads` · `subscriptions` · `gmail_connections` · `reply_sequences` · `signal_results` · `style_profiles`

### Design System
- Background: `#060606` · Cards: `#0e0e0e` · Accent: `#FF5200`
- Borders: `1px solid rgba(255,255,255,0.06)`
- Border radius: 6-8px only
- Status: 6px dot + text label (no colored badges)
- Fonts: Syne 500 headings · Outfit 400 body
- All styling: inline `style={{}}` props (no Tailwind, no CSS modules)
