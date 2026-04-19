# Quick Start

## Daily Commands
```bash
npm run dev       # localhost:3000
npm run build     # type-check + production build
npm run lint      # ESLint
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY          # email sending fallback
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET
```

## Adding a New Dashboard Page
1. Create `app/dashboard/[name]/page.tsx`
2. Add `"use client"` only if hooks needed — prefer server components
3. Copy header pattern (60px, sticky, rgba(6,6,6,0.9) bg)
4. Add nav link in `app/dashboard/_components/sidebar.tsx` (5 items max)

## Adding a New API Route
File: `app/api/[name]/route.ts`
```ts
import { createClient } from "@/lib/supabase/server";
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  // query always includes .eq("user_id", user.id)
}
```

## Checking Plans
```ts
import { PLAN_CREDITS } from "@/lib/plans";
const isProOrAgency = plan === "pro" || plan === "agency";
```
