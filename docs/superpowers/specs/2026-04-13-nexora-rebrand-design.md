# Nexora Outreach — Full Creative Rebrand Spec

**Date:** 2026-04-13  
**Scope:** Complete visual redesign of all dashboard pages and shared chrome. Zero functionality changes.

---

## Constraints

- No new npm packages (framer-motion already installed at v12.38.0)
- No API route changes
- No data model changes
- No route changes
- Every feature must work identically after the rebrand
- Build must pass `npm run build` with zero errors
- No emojis anywhere in the codebase
- No gradients, glows, or purple/multicolor effects
- No animation unless it already exists or is explicitly in this spec

---

## Design Token System (already in globals.css — do not change)

```
Background:   #060606  (--black)
Card surface: #0E0E0E  (--black-2)
Elevated:     #161616  (--black-3)
Accent:       #FF5200  (--orange)
Accent hover: #FF6A1F  (--orange-h)
Easing:       cubic-bezier(0.23, 1, 0.32, 1)  (--ease-out)
```

Fonts: Syne (headings), Outfit (body) — already loaded.

---

## Global CSS Additions (globals.css)

New utility classes to add:
- `.nx-badge` — pill status badge: `rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase`
- `.nx-badge-green` — sent/active state
- `.nx-badge-orange` — pending/draft state
- `.nx-badge-blue` — draft_ready state
- `.nx-badge-gray` — skipped/inactive state
- `.nx-section-label` — 10px uppercase tracking label
- `.nx-card` — standard card: `bg-[#0e0e0e] border border-white/[0.06] rounded-xl`
- `.nx-page-header` — sticky header: height 68px, blur backdrop, border-bottom
- Update `.skeleton` to use `rounded-xl`

---

## Shared Chrome

### Sidebar (sidebar.tsx)
- Width: 232px (up from 216px)
- Logo area: 22px tall "N" mark, 15px Syne wordmark "Nexora"
- Nav item height: 36px, gap: 2px
- Active state: animated `layoutId="sidebar-active-bg"` bg pill (already exists), left accent border
- Inactive color: `#3a3a3a` → hover `#888`
- Bottom section: add credit usage bar — thin `h-1 rounded-full` track + fill in orange
- Plan badge: small pill next to plan name
- Overall: more vertical whitespace between logo/nav/footer sections

### Page Header (repeated on every page)
- Height: 68px (up from 60px)
- Title: 16px Syne weight 500, color #fff
- Subtitle: 11px Outfit, color #3a3a3a
- Right slot: "New Campaign" button or page-specific actions
- Left margin matches sidebar width: 232px

### Main content left margin: 232px (matches new sidebar width)

---

## Page Designs

### Dashboard (page.tsx + dashboard-client.tsx)
- Stat cards: padding `22px 24px`, value `30px Syne 500`, label `10px uppercase tracking`
- 4-column grid stat cards with `gap-3`
- Quick actions: 3-column grid, `18px 20px` padding, arrow icon right-aligned in orange
- Recent campaigns table: replace dot + text with `.nx-badge` pills
- Empty state for no campaigns: 48px icon container + `text-balance` headline + CTA

### Campaigns list (campaigns/page.tsx + campaigns-table.tsx)
- 3 stat cards in a row at top
- Search input: more refined style with proper focus ring
- Filter tabs: pill group with animated background (use framer-motion `layoutId`)
- Table rows: add `border-l-2 border-transparent hover:border-orange/40` via CSS on `.table-row`
- Status: replace dot with `.nx-badge`
- Delete button: icon-only with `aria-label="Delete campaign"`
- Empty state: icon + headline + CTA

### Campaign wizard (campaigns/new/page.tsx)
- Add horizontal step progress rail at top of the form area (below header)
- Steps: "Upload leads" → "Configure" → "Generate" → "Review"
- Step indicator: numbered circles connected by lines, active = orange fill, done = checkmark
- Each step panel: same content as before, just wrapped in better visual container
- Preserve all existing state machine logic exactly

### Campaign detail (campaigns/[id]/page.tsx)
- Header: show campaign name (truncated), status badge, created date
- Tab bar: pill-style tabs with framer-motion `layoutId` animated underline/background
- Tab panels fade in on switch (AnimatePresence mode="wait")
- Overview tab: leads preview cards in better grid
- Leads tab: table with email/name/company columns, better row design
- Follow-ups tab: timeline-style sequence cards
- Performance tab: chart + stats in polished layout

### Inbox (inbox/page.tsx)
- Filter tabs: same pill group pattern
- Reply cards: better visual hierarchy — name/email bold, subject muted, body preview truncated
- Status badge on each card
- Expanded reply view: monospace body text, action buttons at bottom
- Sync/check button in header
- Empty state per filter tab

### Analytics (analytics/page.tsx)
- 4 stat cards with rate indicators
- Chart: taller (200px), better axis styling, tooltip refinement
- Campaign table: colored rate cells (green/gray/red already implemented)
- Upgrade gate: better visual with plan comparison hint

### Follow-ups (followups/page.tsx)
- Campaign accordion cards: expand/collapse with smooth height animation
- Sequence steps as a horizontal timeline within each card
- Status badges on each sequence
- Upgrade gate: icon + headline + CTA

### Signal Radar (signals/page.tsx)
- Signal cards: left orange border accent (already exists), better internal spacing
- Expand/collapse with AnimatePresence
- Pain points / talking points: tag-style chips in `#161616` bg
- Empty state + upgrade gate with consistent style

### Settings (settings/page.tsx)
- Section cards: unified `SectionCard` component (already exists)
- Section labels: `.nx-section-label` class
- Plan cards in a grid with highlighted recommended plan
- Gmail connection: status indicator with connected/disconnected state
- Ghost Writer section: same card treatment
- Danger zone: red-tinted card for account deletion

### Auth pages (login, signup, forgot-password, reset-password)
- Already look clean — minor polish only: slightly larger logo mark (56px), refined spacing

---

## Animation Rules (Emil + baseline-ui compliant)

- Page load: `PageWrapper` fade-up (already in motion.tsx) — use on every page
- Stagger: `StaggerList` + `StaggerItem` on card grids (already exists)
- Tab switches: `AnimatePresence mode="wait"` with 200ms opacity fade
- Sidebar active indicator: `layoutId` spring (already exists)
- Filter tab active: `layoutId` animated background pill
- Status badges: no animation (too frequent)
- Row entry: existing `rowVariants` stagger in campaigns-table
- Count-up: existing `CountUp` on numeric stats
- Never exceed 300ms for UI elements
- Respect `prefers-reduced-motion` (inherit from existing CSS)

---

## Typography Rules (baseline-ui)

- All page headings: `text-balance`
- All body/paragraph text: `text-pretty`  
- All numeric data: `tabular-nums`
- Never modify `letter-spacing` on body text
- Never add `tracking-*` unless already present

---

## Component Patterns

- All status indicators → `.nx-badge` pill (never dot + text)
- All icon-only buttons → must have `aria-label`
- All destructive actions → keep existing `confirm()` (no AlertDialog available without new package)
- All loading states → `.skeleton` div (not spinners)
- All empty states → icon (48px container) + `text-balance` headline + single CTA link/button

---

## File Change List

1. `app/globals.css` — add badge classes, refine existing utilities
2. `app/dashboard/_components/sidebar.tsx` — width, spacing, credit bar
3. `app/dashboard/layout.tsx` — update margin-left to 232px
4. `app/dashboard/page.tsx` — header height, spacing
5. `app/dashboard/_components/dashboard-client.tsx` — card polish, badges, empty state
6. `app/dashboard/campaigns/page.tsx` — header, empty state
7. `app/dashboard/campaigns/_components/campaigns-table.tsx` — badges, filter tabs animation, row hover
8. `app/dashboard/campaigns/new/page.tsx` — step progress rail
9. `app/dashboard/campaigns/[id]/page.tsx` — animated tabs, header treatment
10. `app/dashboard/campaigns/[id]/follow-ups-tab.tsx` — timeline cards
11. `app/dashboard/campaigns/[id]/analytics-tab.tsx` — chart polish
12. `app/dashboard/campaigns/[id]/send-button.tsx` — button polish
13. `app/dashboard/inbox/page.tsx` — card redesign, filter tabs, empty state
14. `app/dashboard/analytics/page.tsx` — chart height, upgrade gate
15. `app/dashboard/followups/page.tsx` — accordion cards, timeline
16. `app/dashboard/signals/page.tsx` — card polish, chip tags, empty state
17. `app/dashboard/settings/page.tsx` — section cards, plan grid
18. `app/dashboard/verify-banner.tsx` — minor polish
19. `app/dashboard/payment-banner.tsx` — minor polish
20. `components/upgrade-modal.tsx` — modal polish
21. `app/(auth)/login/page.tsx` — logo size
22. `app/(auth)/signup/page.tsx` — logo size
