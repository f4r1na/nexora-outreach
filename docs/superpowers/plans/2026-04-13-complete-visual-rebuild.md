# Complete Visual Rebuild — Nexora Outreach

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every UI page and component from scratch to look like a $50M startup product — dark, editorial, premium, alive with motion.

**Architecture:** Inline styles (existing convention) + framer-motion for animations + Lucide React icons. No Tailwind in dashboard pages. Auth pages keep their existing Tailwind-based structure. CSS design tokens in globals.css drive every color/spacing decision. No functionality changes — only visual.

**Tech Stack:** Next.js 16.2.2, framer-motion 12, lucide-react (new), Syne + Outfit fonts, Tailwind v4 (auth pages only), inline styles (dashboard/landing).

---

## Design System

### Palette
```
Background:   #060606
Cards:        #0e0e0e
Elevated:     #111111
Borders:      rgba(255,255,255,0.06)
Accent:       #FF5200
Accent hover: #FF6B1A
Text primary: #ffffff
Text 2:       rgba(255,255,255,0.6)  → #888
Text 3:       rgba(255,255,255,0.35) → #555
Text muted:   rgba(255,255,255,0.18) → #333
```

### Typography
```
Headings: Syne, weight 500–700, letterSpacing -0.02em to -0.03em
Body:     Outfit, weight 400–500
Labels:   Outfit 10px, 500, 0.07em tracking, uppercase, #444
Numbers:  fontVariantNumeric: "tabular-nums"
```

### Spacing
```
Card padding:    20px 24px
Section padding: 28px 32px (header), 28px 32px 80px (main)
Card radius:     10px
Button radius:   7px
Gap between cards: 10px
```

### Interactions
- Cards: `translateY(-1px)` on hover, `border-color` brightens
- Buttons: `scale(0.97)` on :active
- Nav links: bg fade in/out
- Sidebar active: framer-motion `layoutId` sliding bg
- All transitions: 0.15–0.22s, ease [0.23, 1, 0.32, 1]

---

## File Map

| File | Action |
|------|--------|
| `app/globals.css` | Rewrite — new design tokens, classes |
| `app/page.tsx` | Rewrite — new landing page |
| `app/_landing/demo.tsx` | Keep |
| `app/_landing/cta.tsx` | Keep |
| `app/dashboard/_components/sidebar.tsx` | Rewrite — Lucide icons |
| `app/dashboard/_components/motion.tsx` | Keep (already solid) |
| `app/dashboard/layout.tsx` | Update sidebar width ref |
| `app/dashboard/page.tsx` | Rewrite |
| `app/dashboard/_components/dashboard-client.tsx` | Rewrite |
| `app/dashboard/campaigns/page.tsx` | Rewrite |
| `app/dashboard/campaigns/_components/campaigns-table.tsx` | Rewrite |
| `app/dashboard/campaigns/new/page.tsx` | Rewrite |
| `app/dashboard/campaigns/[id]/page.tsx` | Rewrite |
| `app/dashboard/campaigns/[id]/analytics-tab.tsx` | Rewrite |
| `app/dashboard/campaigns/[id]/follow-ups-tab.tsx` | Rewrite |
| `app/dashboard/campaigns/[id]/send-button.tsx` | Update styling only |
| `app/dashboard/inbox/page.tsx` | Rewrite |
| `app/dashboard/analytics/page.tsx` | Rewrite |
| `app/dashboard/settings/page.tsx` | Rewrite |
| `app/dashboard/followups/page.tsx` | Rewrite |
| `app/dashboard/signals/page.tsx` | Rewrite |
| `components/upgrade-modal.tsx` | Update borderRadius |

---

## Task 1: Install lucide-react + update globals.css

**Files:**
- Modify: `package.json` (via npm install)
- Rewrite: `app/globals.css`

- [ ] **Step 1: Install lucide-react**
```bash
cd C:\Users\User\nexora-outreach && npm install lucide-react
```

- [ ] **Step 2: Rewrite globals.css**

Complete new file — keep all existing class names so auth pages don't break, update values and add new utilities.

Key changes:
- Add `--sidebar-width: 240px`
- Tighten `.nx-input` focus state
- New `.card` hover utility
- Remove duplicate `.table-row:hover` rule
- Add `.nx-field-label`, `.nx-page-header` utilities

- [ ] **Step 3: Verify build**
```bash
npm run build
```

---

## Task 2: Landing page rebuild (app/page.tsx)

**Files:**
- Rewrite: `app/page.tsx`

Design: Dark editorial hero. Sections: Nav → Hero → Social proof bar → How it works → Feature grid → Pricing → CTA → Footer.

Key design decisions:
- Nav: logo left, links center (hidden mobile), auth right. Backdrop blur.
- Hero: Huge Syne headline (clamp 44–88px), #FF5200 word highlight, subtle description, two CTAs
- No gradients (baseline-ui rule: "NEVER use gradients unless explicitly requested") — use radial overlays very sparingly as background texture only
- Feature cards: 1px border, #0e0e0e bg, icon + title + desc
- Pricing: 4 cards, highlight Pro with orange border
- Footer: 3-column, minimal

- [ ] **Step 1: Write new app/page.tsx**
- [ ] **Step 2: Verify build**

---

## Task 3: Sidebar rebuild

**Files:**
- Rewrite: `app/dashboard/_components/sidebar.tsx`
- Modify: `app/dashboard/layout.tsx` (update marginLeft to 240)

Design:
- Width: 240px
- Background: #080808
- Logo: orange square + "Nexora" in Syne
- Nav: 5 items with Lucide icons, framer-motion `layoutId` active indicator
- Bottom: credits bar, email, plan badge, sign out

Lucide icons to use:
- Dashboard: `LayoutDashboard`
- Campaigns: `Mail`
- Inbox: `Inbox`
- Analytics: `BarChart3`
- Settings: `Settings`
- LogOut

- [ ] **Step 1: Rewrite sidebar.tsx**
- [ ] **Step 2: Update layout.tsx marginLeft**
- [ ] **Step 3: Verify build**

---

## Task 4: Dashboard page rebuild

**Files:**
- Rewrite: `app/dashboard/page.tsx`
- Rewrite: `app/dashboard/_components/dashboard-client.tsx`

Design:
- Header: sticky 68px, "Dashboard" heading + user email subtitle + "New Campaign" button
- Stat grid: 4 cards (Emails Generated, Campaigns, Credits Remaining, Plan)
- Quick actions: 3 cards row (New Campaign, Check Inbox, Analytics)
- Recent campaigns: table with last 5

- [ ] **Step 1: Rewrite dashboard-client.tsx**
- [ ] **Step 2: Update dashboard page.tsx header**
- [ ] **Step 3: Verify build**

---

## Task 5: Campaigns list + table rebuild

**Files:**
- Rewrite: `app/dashboard/campaigns/page.tsx`
- Rewrite: `app/dashboard/campaigns/_components/campaigns-table.tsx`

Table columns: Name | Leads | Status | Created | Actions
- Search input with Lucide `Search` icon
- Filter tabs: All / Sent / Draft
- nx-badge status pills
- Trash + View actions

- [ ] **Step 1: Rewrite campaigns-table.tsx**
- [ ] **Step 2: Rewrite campaigns/page.tsx**
- [ ] **Step 3: Verify build**

---

## Task 6: Campaign wizard rebuild

**Files:**
- Rewrite: `app/dashboard/campaigns/new/page.tsx`

Step indicator: 3 steps with step-circle CSS classes.
Step 1: Name + tone selection
Step 2: File upload dropzone
Step 3: Email review + send/export

Keep all existing logic (CSV parsing, API calls, state). Only rebuild visual layer.

- [ ] **Step 1: Rewrite new/page.tsx**
- [ ] **Step 2: Verify build**

---

## Task 7: Campaign detail page + tabs rebuild

**Files:**
- Rewrite: `app/dashboard/campaigns/[id]/page.tsx`
- Rewrite: `app/dashboard/campaigns/[id]/analytics-tab.tsx`
- Rewrite: `app/dashboard/campaigns/[id]/follow-ups-tab.tsx`

Tab bar: Overview | Leads | Follow-ups | Performance — orange underline on active.
Overview: campaign info card.
Leads: card list with subject + body preview.
Analytics: stat blocks + rate bars.
Follow-ups: sequence rows.

- [ ] **Step 1: Rewrite [id]/page.tsx**
- [ ] **Step 2: Rewrite analytics-tab.tsx**
- [ ] **Step 3: Rewrite follow-ups-tab.tsx**
- [ ] **Step 4: Verify build**

---

## Task 8: Inbox page rebuild

**Files:**
- Rewrite: `app/dashboard/inbox/page.tsx`

Design:
- Header: "Inbox" + "Sync inbox" button
- Filter tabs: All / Needs Response / Responded / Dismissed
- Reply cards: expandable, nx-badge status, AI draft textarea

Keep all action handlers (generateDraft, action, delete).

- [ ] **Step 1: Rewrite inbox/page.tsx**
- [ ] **Step 2: Verify build**

---

## Task 9: Analytics page rebuild

**Files:**
- Rewrite: `app/dashboard/analytics/page.tsx`

Design:
- 4 stat cards (Sent, Open Rate, Click Rate, Reply Rate)
- Line chart (recharts, keep)
- Campaign breakdown table
- Upgrade gate for free users

- [ ] **Step 1: Rewrite analytics/page.tsx**
- [ ] **Step 2: Verify build**

---

## Task 10: Settings + remaining pages

**Files:**
- Rewrite: `app/dashboard/settings/page.tsx`
- Rewrite: `app/dashboard/followups/page.tsx`
- Rewrite: `app/dashboard/signals/page.tsx`

Settings sections:
- Subscription (plan + usage bar + upgrade buttons)
- Email (Gmail connect/disconnect)
- Writing Style (Ghost Writer samples)

Followups: Campaign cards with sequence rows.
Signals: SignalCard with expandable details.

- [ ] **Step 1: Rewrite settings/page.tsx**
- [ ] **Step 2: Rewrite followups/page.tsx**
- [ ] **Step 3: Rewrite signals/page.tsx**
- [ ] **Step 4: Verify build**

---

## Task 11: Final build + commit

- [ ] **Step 1: Run full build**
```bash
npm run build
```
Expected: ✓ Compiled successfully, 24+ routes, 0 errors

- [ ] **Step 2: Stage all changes**
```bash
git add app/ components/ package.json package-lock.json
```

- [ ] **Step 3: Commit**
```bash
git commit -m "rebuild: complete visual overhaul — Lucide icons, new design system, every page rebuilt"
```

- [ ] **Step 4: Push**
```bash
git push
```
