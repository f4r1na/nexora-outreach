# Common Mistakes

## 1. Importing Supabase client in server components
**Wrong:** `import { createClient } from "@/lib/supabase/client"`
**Right:** `import { createClient } from "@/lib/supabase/server"` — then `await createClient()`
Server vs browser client are different files. Wrong one causes cookie/auth failures silently.

## 2. Forgetting `await params` in Next.js 15 dynamic routes
**Wrong:** `const { id } = params`
**Right:** `const { id } = await params`
Both `params` and `searchParams` are Promises in Next.js 15 App Router. Missing await = TypeScript error + runtime crash.

## 3. Adding colored icon boxes, pill badges, or glow effects
This codebase has a strict design system — no `borderRadius: 999`, no `boxShadow` glows, no colored `backgroundColor` on icon wrappers.
- Status indicators: 6px dot + plain text only
- Upgrade gates: plain lock icon, no orange box
- Buttons: borderRadius 6-8px, fontWeight 400-500 max
Violating this creates visual inconsistency across all pages.

## 4. Using `fontWeight: 700` or `800` anywhere
Max fontWeight is 500 (headings via Syne) and 400 (body via Outfit). Nothing heavier. Check before adding any text style.

## 5. Direct Supabase queries without `.eq("user_id", user.id)`
Every DB query must scope to the authenticated user. Missing this leaks data across accounts. Pattern:
```ts
supabase.from("table").select("...").eq("user_id", user.id)
```
