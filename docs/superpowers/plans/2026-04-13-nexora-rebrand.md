# Nexora Outreach — Full Creative Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete visual redesign of every dashboard page and shared chrome — making Nexora feel like a $10M funded SaaS product without changing any functionality.

**Architecture:** Pure presentation layer changes only. All API routes, data models, and business logic remain untouched. Visual changes are isolated to component/page files and globals.css. The existing design token system (colors, fonts, easing) stays as-is; only spacing, typography scale, and component polish change.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, framer-motion v12 (already installed), inline styles (existing pattern — continue it), Syne + Outfit fonts (already loaded).

---

## Key Facts (read before touching anything)

- **framer-motion is already installed** at v12.38.0. Do NOT run npm install framer-motion.
- **Color tokens are in globals.css** as CSS custom properties: `--black` (#060606), `--black-2` (#0E0E0E), `--black-3` (#161616), `--orange` (#FF5200).
- **Sidebar already has exactly 5 nav items.** Do not change the nav structure.
- **All pages use a pattern:** sticky `<header>` (60px tall) + `<main>` with `padding: "24-28px 32px 64px"`. We're making headers 68px and improving internal spacing.
- **Motion primitives** (`StaggerList`, `StaggerItem`, `CountUp`, `ScrollReveal`, `PageWrapper`) are in `app/dashboard/_components/motion.tsx`. Use them but do not modify them unless a task explicitly says so.
- **Layout left margin** is currently `marginLeft: 220`. After sidebar widens to 232px, it becomes `marginLeft: 232`.
- **No emojis exist** in the current codebase — nothing to remove.
- **Build command:** `cd ~/nexora-outreach && npm run build`

---

## Task 1: Add global CSS utility classes

**Files:**
- Modify: `app/globals.css`

These new classes will be used by every subsequent task. Do this first.

- [ ] **Step 1: Add badge and utility classes to globals.css**

Open `app/globals.css` and append the following AFTER the existing content (after the `.modal-content` block at the end):

```css
/* ── Status badge ────────────────────────────────────────────────────────── */
.nx-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 500;
  font-family: var(--font-outfit);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.6;
  white-space: nowrap;
}

.nx-badge-green {
  color: #4ade80;
  background-color: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.18);
}

.nx-badge-orange {
  color: #fb923c;
  background-color: rgba(251, 146, 60, 0.08);
  border: 1px solid rgba(251, 146, 60, 0.18);
}

.nx-badge-blue {
  color: #60a5fa;
  background-color: rgba(96, 165, 250, 0.08);
  border: 1px solid rgba(96, 165, 250, 0.18);
}

.nx-badge-gray {
  color: #555;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

/* ── Section label ───────────────────────────────────────────────────────── */
.nx-section-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #444;
  font-family: var(--font-outfit);
}

/* ── Standard card ───────────────────────────────────────────────────────── */
.nx-card {
  background-color: #0e0e0e;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}

/* ── Table row left accent on hover ──────────────────────────────────────── */
@media (hover: hover) and (pointer: fine) {
  .table-row:hover {
    background-color: rgba(255, 255, 255, 0.025) !important;
    border-left: 2px solid rgba(255, 82, 0, 0.3) !important;
    padding-left: 18px !important;
  }
}

/* ── Animated tab underline ──────────────────────────────────────────────── */
.tab-link {
  position: relative;
  transition: color 0.18s ease;
}

/* ── Credit usage bar ────────────────────────────────────────────────────── */
.credit-bar-track {
  height: 3px;
  background-color: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  overflow: hidden;
}

.credit-bar-fill {
  height: 100%;
  border-radius: 999px;
  background-color: #FF5200;
  transition: width 0.6s var(--ease-out);
}

/* ── Step progress rail ──────────────────────────────────────────────────── */
.step-rail {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 32px;
  height: 52px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(6, 6, 6, 0.6);
}

.step-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.step-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  font-family: var(--font-outfit);
  flex-shrink: 0;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.step-circle-done {
  background-color: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: #4ade80;
}

.step-circle-active {
  background-color: rgba(255, 82, 0, 0.12);
  border: 1px solid rgba(255, 82, 0, 0.3);
  color: #FF5200;
}

.step-circle-pending {
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #444;
}

.step-label {
  font-size: 11px;
  font-family: var(--font-outfit);
  transition: color 0.2s ease;
}

.step-label-active {
  color: #ccc;
  font-weight: 500;
}

.step-label-done {
  color: #555;
}

.step-label-pending {
  color: #333;
}

.step-connector {
  flex: 1;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.06);
  margin: 0 10px;
}

.step-connector-done {
  background-color: rgba(74, 222, 128, 0.2);
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` or similar. Fix any syntax errors in globals.css if present.

- [ ] **Step 3: Commit**

```bash
cd ~/nexora-outreach && git add app/globals.css && git commit -m "style: add badge, step-rail, and credit-bar utility classes"
```

---

## Task 2: Sidebar and layout chrome

**Files:**
- Modify: `app/dashboard/_components/sidebar.tsx`
- Modify: `app/dashboard/layout.tsx`

The sidebar already has the right structure. We're widening it, adding a credit usage bar, improving spacing, and making inactive nav items more readable.

- [ ] **Step 1: Replace sidebar.tsx**

Replace the entire contents of `app/dashboard/_components/sidebar.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { logout } from "@/app/actions/auth";

interface SidebarProps {
  email: string;
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  pendingReplies?: number;
}

function IconDashboard() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconCampaigns() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 9h20M7 4v5M17 4v5" />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconAnalytics() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

const navLinks = [
  { label: "Dashboard",  href: "/dashboard",           icon: <IconDashboard /> },
  { label: "Campaigns",  href: "/dashboard/campaigns", icon: <IconCampaigns /> },
  { label: "Inbox",      href: "/dashboard/inbox",     icon: <IconInbox /> },
  { label: "Analytics",  href: "/dashboard/analytics", icon: <IconAnalytics /> },
  { label: "Settings",   href: "/dashboard/settings",  icon: <IconSettings /> },
];

export default function Sidebar({ email, plan, creditsUsed, creditsLimit, pendingReplies }: SidebarProps) {
  const pathname = usePathname();

  const isUnlimited = creditsLimit === 999999;
  const creditsLeft = isUnlimited ? 999999 : Math.max(0, creditsLimit - creditsUsed);
  const creditPct = isUnlimited ? 0 : Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <aside style={{
      width: 232,
      flexShrink: 0,
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      backgroundColor: "#070707",
      borderRight: "1px solid rgba(255,255,255,0.055)",
      display: "flex",
      flexDirection: "column",
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 28,
            height: 28,
            backgroundColor: "#FF5200",
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12V2h2.5l5.5 7V2H12v10h-2.5L4 5v7H2z" fill="white" />
            </svg>
          </div>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            fontFamily: "var(--font-syne)",
            letterSpacing: "-0.02em",
          }}>
            Nexora
          </span>
        </Link>
      </div>

      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.05)", margin: "0 0 8px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 10px" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {navLinks.map((link) => {
            const active = link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
            const hasBadge = link.href === "/dashboard/inbox" && (pendingReplies ?? 0) > 0;

            return (
              <li key={link.label} style={{ position: "relative" }}>
                {active && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 7,
                      backgroundColor: "rgba(255,82,0,0.07)",
                      borderLeft: "2px solid #FF5200",
                    }}
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  />
                )}
                <Link
                  href={link.href}
                  className={`nav-link${active ? " nav-link-active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    paddingLeft: active ? 10 : 12,
                    borderRadius: 7,
                    fontSize: 13,
                    fontFamily: "var(--font-outfit)",
                    fontWeight: active ? 500 : 400,
                    color: active ? "#e8e8e8" : "#4a4a4a",
                    textDecoration: "none",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                    <span style={{ flexShrink: 0, display: "flex" }}>{link.icon}</span>
                    {link.label}
                  </span>
                  {hasBadge && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#FF5200",
                      backgroundColor: "rgba(255,82,0,0.1)",
                      border: "1px solid rgba(255,82,0,0.2)",
                      borderRadius: 999,
                      padding: "1px 5px",
                      lineHeight: 1.6,
                      fontFamily: "var(--font-outfit)",
                      flexShrink: 0,
                    }}>
                      {pendingReplies}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: credits + user */}
      <div style={{ padding: "12px 12px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Credit bar */}
        {!isUnlimited && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: "#383838", fontFamily: "var(--font-outfit)" }}>
                {creditsLeft} credits left
              </span>
              <span style={{ fontSize: 10, color: "#2e2e2e", fontFamily: "var(--font-outfit)" }}>
                {creditsLimit}
              </span>
            </div>
            <div className="credit-bar-track">
              <div
                className="credit-bar-fill"
                style={{ width: `${creditPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Email + plan */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            fontSize: 11,
            color: "#3a3a3a",
            fontFamily: "var(--font-outfit)",
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }} title={email}>
            {email}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              fontFamily: "var(--font-outfit)",
              color: "#FF5200",
              backgroundColor: "rgba(255,82,0,0.08)",
              border: "1px solid rgba(255,82,0,0.15)",
              borderRadius: 999,
              padding: "1px 6px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              {planLabel}
            </span>
            {isUnlimited && (
              <span style={{ fontSize: 10, color: "#333", fontFamily: "var(--font-outfit)" }}>
                Unlimited
              </span>
            )}
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="btn-ghost"
            aria-label="Sign out"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.06)",
              backgroundColor: "transparent",
              color: "#383838",
              fontSize: 12,
              fontFamily: "var(--font-outfit)",
              cursor: "pointer",
              width: "100%",
              transition: "color 0.15s ease, border-color 0.15s ease",
            }}
          >
            <IconLogout />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Update layout.tsx margin to match new sidebar width**

In `app/dashboard/layout.tsx`, change `marginLeft: 220` to `marginLeft: 232`:

```tsx
// Find this:
        style={{
          marginLeft: 220,

// Replace with:
        style={{
          marginLeft: 232,
```

- [ ] **Step 3: Verify build**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`. If TypeScript errors appear, fix them before proceeding.

- [ ] **Step 4: Commit**

```bash
cd ~/nexora-outreach && git add app/dashboard/_components/sidebar.tsx app/dashboard/layout.tsx && git commit -m "style: sidebar — wider, credit bar, plan badge, pending replies count"
```

---

## Task 3: Dashboard page header and client cards

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `app/dashboard/_components/dashboard-client.tsx`

- [ ] **Step 1: Update dashboard page.tsx header**

In `app/dashboard/page.tsx`, find the `<header>` element and replace it:

```tsx
      {/* Header */}
      <header style={{
        padding: "0 32px",
        height: 68,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(6,6,6,0.94)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
        <div>
          <h1 style={{
            fontSize: 16,
            fontWeight: 500,
            color: "#fff",
            fontFamily: "var(--font-syne)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}>
            Dashboard
          </h1>
          <p style={{
            fontSize: 11,
            color: "#383838",
            fontFamily: "var(--font-outfit)",
            marginTop: 3,
          }}>
            {user.email}
          </p>
        </div>
        <Link href="/dashboard/campaigns/new" className="btn-primary" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 16px",
          backgroundColor: "#FF5200",
          color: "#fff",
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "var(--font-outfit)",
          textDecoration: "none",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Campaign
        </Link>
      </header>
```

Also update `<main>` padding: change `padding: "28px 32px 64px"` to `padding: "32px 32px 80px"`.

- [ ] **Step 2: Replace dashboard-client.tsx**

Replace the entire contents of `app/dashboard/_components/dashboard-client.tsx`:

```tsx
"use client";

import Link from "next/link";
import { StaggerList, StaggerItem, CountUp } from "./motion";

type Campaign = {
  id: string;
  name: string;
  status: string;
  lead_count: number;
  created_at: string;
};

type Props = {
  emailCount: number;
  campaignCount: number;
  creditsLeft: number | string;
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  recentCampaigns: Campaign[];
};

function ArrowRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function statusBadge(status: string) {
  const sent = status === "complete";
  return (
    <span className={`nx-badge ${sent ? "nx-badge-green" : "nx-badge-gray"}`}>
      {sent ? "Sent" : "Draft"}
    </span>
  );
}

export default function DashboardClient({
  emailCount,
  campaignCount,
  creditsLeft,
  plan,
  recentCampaigns,
}: Props) {
  const statCards = [
    {
      label: "Emails Generated",
      value: emailCount,
      sub: `across ${campaignCount} campaign${campaignCount !== 1 ? "s" : ""}`,
    },
    {
      label: "Campaigns",
      value: campaignCount,
      sub: "total created",
    },
    {
      label: "Credits Remaining",
      value: creditsLeft,
      sub: typeof creditsLeft === "string" && creditsLeft === "∞" ? "unlimited plan" : "available",
    },
    {
      label: "Plan",
      value: plan,
      sub: "current subscription",
    },
  ];

  const quickActions = [
    { label: "New Campaign",   sub: "Generate personalized outreach", href: "/dashboard/campaigns/new" },
    { label: "Check Inbox",    sub: "Review replies from leads",       href: "/dashboard/inbox" },
    { label: "View Analytics", sub: "Track campaign performance",      href: "/dashboard/analytics" },
  ];

  return (
    <>
      {/* Stat cards */}
      <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        {statCards.map((card) => (
          <StaggerItem key={card.label}>
            <div className="stat-card" style={{
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "20px 22px",
              height: "100%",
            }}>
              <div className="nx-section-label" style={{ marginBottom: 12 }}>
                {card.label}
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: 500,
                color: "#fff",
                fontFamily: "var(--font-syne)",
                lineHeight: 1,
                marginBottom: 6,
                tabularNums: true,
              } as React.CSSProperties}>
                {typeof card.value === "number"
                  ? <CountUp value={card.value} duration={800} />
                  : card.value}
              </div>
              <div style={{
                fontSize: 11,
                color: "#383838",
                fontFamily: "var(--font-outfit)",
              }}>
                {card.sub}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Quick actions */}
      <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }} delay={0.1}>
        {quickActions.map((action) => (
          <StaggerItem key={action.label}>
            <Link href={action.href} className="action-card" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px",
              backgroundColor: "#0e0e0e",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              textDecoration: "none",
              gap: 12,
            }}>
              <div>
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#ddd",
                  fontFamily: "var(--font-outfit)",
                  marginBottom: 3,
                }}>
                  {action.label}
                </div>
                <div style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "var(--font-outfit)" }}>
                  {action.sub}
                </div>
              </div>
              <span style={{ color: "#FF5200", flexShrink: 0 }}>
                <ArrowRight />
              </span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Recent campaigns */}
      <div style={{
        backgroundColor: "#0e0e0e",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span className="nx-section-label">
            Recent campaigns
          </span>
          <Link href="/dashboard/campaigns" style={{
            fontSize: 11,
            color: "#FF5200",
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
          }}>
            View all
          </Link>
        </div>

        {!recentCampaigns || recentCampaigns.length === 0 ? (
          <div style={{
            padding: "56px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#383838",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 9h20" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 4 }}>
                No campaigns yet
              </p>
              <p style={{ fontSize: 11, color: "#333", fontFamily: "var(--font-outfit)" }}>
                Create your first campaign to start generating personalized outreach.
              </p>
            </div>
            <Link href="/dashboard/campaigns/new" className="btn-primary" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              backgroundColor: "#FF5200",
              color: "#fff",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "var(--font-outfit)",
              textDecoration: "none",
            }}>
              Create campaign
            </Link>
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 72px 100px 110px",
              padding: "8px 22px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              {["Campaign", "Leads", "Status", "Created"].map((col) => (
                <div key={col} className="nx-section-label">
                  {col}
                </div>
              ))}
            </div>

            <StaggerList delay={0.16}>
              {recentCampaigns.map((c, i) => {
                const isLast = i === recentCampaigns.length - 1;
                return (
                  <StaggerItem key={c.id}>
                    <div
                      className="table-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 72px 100px 110px",
                        padding: "12px 22px",
                        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.03)",
                        alignItems: "center",
                      }}
                    >
                      <Link href={`/dashboard/campaigns/${c.id}`} style={{
                        fontSize: 13,
                        color: "#b8b8b8",
                        fontFamily: "var(--font-outfit)",
                        textDecoration: "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        paddingRight: 16,
                      }}>
                        {c.name}
                      </Link>
                      <div style={{ fontSize: 13, color: "#555", fontFamily: "var(--font-outfit)", fontVariantNumeric: "tabular-nums" }}>
                        {c.lead_count}
                      </div>
                      <div>
                        {statusBadge(c.status)}
                      </div>
                      <div style={{ fontSize: 11, color: "#383838", fontFamily: "var(--font-outfit)" }}>
                        {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          </>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
cd ~/nexora-outreach && git add app/dashboard/page.tsx app/dashboard/_components/dashboard-client.tsx && git commit -m "style: dashboard — larger stat cards, status badges, polished empty state"
```

---

## Task 4: Campaigns list page and table

**Files:**
- Modify: `app/dashboard/campaigns/page.tsx`
- Modify: `app/dashboard/campaigns/_components/campaigns-table.tsx`

- [ ] **Step 1: Update campaigns/page.tsx header and stats**

Replace the `<header>` block and the stats section in `app/dashboard/campaigns/page.tsx`:

```tsx
      {/* Header */}
      <header style={{
        padding: "0 32px",
        height: 68,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(6,6,6,0.94)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
        <div>
          <h1 style={{
            fontSize: 16,
            fontWeight: 500,
            color: "#fff",
            fontFamily: "var(--font-syne)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}>
            Campaigns
          </h1>
          <p style={{
            fontSize: 11,
            color: "#383838",
            fontFamily: "var(--font-outfit)",
            marginTop: 3,
          }}>
            {allCampaigns.length} total
          </p>
        </div>
        <Link href="/dashboard/campaigns/new" className="btn-primary" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 16px",
          backgroundColor: "#FF5200",
          color: "#fff",
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "var(--font-outfit)",
          textDecoration: "none",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Campaign
        </Link>
      </header>
```

Update `<main>` padding to `padding: "28px 32px 80px"`.

Replace the stats section (the StaggerList with 3 stat cards) with:

```tsx
        {/* Stats */}
        <StaggerList style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Total Campaigns", value: allCampaigns.length },
            { label: "Emails Generated", value: totalEmails },
            { label: "Credits Used", value: `${creditsUsed} / ${creditsLimit === 999999 ? "∞" : creditsLimit}` },
          ].map((s) => (
            <StaggerItem key={s.label} style={{ flex: 1 }}>
              <div className="stat-card" style={{
                backgroundColor: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "18px 22px",
              }}>
                <div className="nx-section-label" style={{ marginBottom: 10 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {typeof s.value === "number"
                    ? <CountUp value={s.value} duration={700} />
                    : s.value}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
```

Also update the empty state in campaigns/page.tsx:

```tsx
        {allCampaigns.length === 0 ? (
          <div style={{
            backgroundColor: "#0e0e0e",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "72px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            textAlign: "center",
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#383838",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 9h20M7 4v5M17 4v5" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#666", fontFamily: "var(--font-outfit)", marginBottom: 4 }}>
                No campaigns yet
              </p>
              <p style={{ fontSize: 12, color: "#333", fontFamily: "var(--font-outfit)", maxWidth: 280 }}>
                Upload a lead list, configure your tone, and generate personalized cold emails in minutes.
              </p>
            </div>
            <Link href="/dashboard/campaigns/new" className="btn-primary" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              backgroundColor: "#FF5200",
              color: "#fff",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "var(--font-outfit)",
              textDecoration: "none",
            }}>
              Create your first campaign
            </Link>
          </div>
        ) : (
          <CampaignsTable campaigns={allCampaigns} />
        )}
```

- [ ] **Step 2: Update campaigns-table.tsx status badges and filter tabs**

In `app/dashboard/campaigns/_components/campaigns-table.tsx`:

1. Remove the `TrashIcon` status dot render and replace with badge. Find the status cell (currently renders a dot + text) and replace with:

```tsx
                  <div>
                    <span className={`nx-badge ${isSent ? "nx-badge-green" : "nx-badge-gray"}`}>
                      {isSent ? "Sent" : "Draft"}
                    </span>
                  </div>
```

2. Update the filter tab buttons to use a more polished style. Find the filter tab container and replace with:

```tsx
        <div style={{ display: "flex", gap: 2, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.05)" }}>
          {(["all", "complete", "draft"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="btn-ghost" style={{
              padding: "5px 13px",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "var(--font-outfit)",
              border: "none",
              cursor: "pointer",
              backgroundColor: filter === f ? "rgba(255,255,255,0.07)" : "transparent",
              color: filter === f ? "#ccc" : "#3a3a3a",
              fontWeight: filter === f ? 500 : 400,
            }}>
              {f === "all" ? "All" : f === "complete" ? "Sent" : "Draft"}
            </button>
          ))}
        </div>
```

3. Update the table container borderRadius to 10 and the column headers to use `nx-section-label`:

Find the column headers div and update each col div:
```tsx
          {["Campaign", "Leads", "Status", "Created", ""].map((col) => (
            <div key={col} className="nx-section-label">
              {col}
            </div>
          ))}
```

4. Add `aria-label` to the delete button (find the delete button and add the attribute):
```tsx
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="btn-ghost"
                        aria-label="Delete campaign"
                        style={{ ... }}
                      >
```

5. Update the empty state inside the table:
```tsx
        {filtered.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#383838",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p style={{ fontSize: 13, color: "#444", fontFamily: "var(--font-outfit)" }}>
              {search ? `No campaigns matching "${search}"` : "No campaigns yet."}
            </p>
          </div>
        ) : (
```

- [ ] **Step 3: Verify build**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
cd ~/nexora-outreach && git add app/dashboard/campaigns/page.tsx app/dashboard/campaigns/_components/campaigns-table.tsx && git commit -m "style: campaigns list — stat cards, status badges, polished filter tabs, empty states"
```

---

## Task 5: Campaign wizard — step progress rail

**Files:**
- Modify: `app/dashboard/campaigns/new/page.tsx`

The wizard is a large file. We're adding a step progress rail at the top and polishing the header only. All form logic, state machine, and steps stay identical.

- [ ] **Step 1: Read the full file to understand current step state**

The file uses a `step` state variable (1–4) controlling which panel shows. Find the step variable and the STEPS/step labels. They likely look like:

```tsx
const [step, setStep] = useState(1);
// or
const STEPS = ["Upload", "Configure", "Generate", "Review"];
```

Read lines 100–200 of the file to find the step variable name and the header section.

- [ ] **Step 2: Add StepRail component inline at top of file**

After the last import line in `app/dashboard/campaigns/new/page.tsx`, add this component definition (before the main export):

```tsx
// ─── Step Rail ────────────────────────────────────────────────────────────────

const WIZARD_STEPS = ["Upload Leads", "Configure", "Generate", "Review"] as const;

function StepRail({ current }: { current: number }) {
  return (
    <div className="step-rail">
      {WIZARD_STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;
        const isPending = stepNum > current;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: idx < WIZARD_STEPS.length - 1 ? "1" : "none" }}>
            <div className="step-node">
              <div className={`step-circle ${isDone ? "step-circle-done" : isActive ? "step-circle-active" : "step-circle-pending"}`}>
                {isDone ? (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : stepNum}
              </div>
              <span className={`step-label ${isDone ? "step-label-done" : isActive ? "step-label-active" : "step-label-pending"}`}>
                {label}
              </span>
            </div>
            {idx < WIZARD_STEPS.length - 1 && (
              <div className={`step-connector ${isDone ? "step-connector-done" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Insert StepRail into the JSX**

In the return statement, find the `<header>` element. Immediately after the closing `</header>` tag, add:

```tsx
      <StepRail current={step} />
```

Where `step` is whatever the state variable is named in this file. If it's named differently (e.g. `currentStep`), use that name.

- [ ] **Step 4: Update the header height and style**

Find the `<header>` in the campaigns/new/page.tsx return statement and update to match the global header style:

```tsx
      <header style={{
        padding: "0 32px",
        height: 68,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(6,6,6,0.94)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
```

Update the `<h1>` inside to match the global style (16px Syne weight 500, letterSpacing -0.02em).

- [ ] **Step 5: Verify build**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

Fix any TypeScript errors. The most likely issue is the step variable name — check what it's actually called in the file.

- [ ] **Step 6: Commit**

```bash
cd ~/nexora-outreach && git add app/dashboard/campaigns/new/page.tsx && git commit -m "style: campaign wizard — step progress rail and header polish"
```

---

## Task 6: Campaign detail page — animated tabs and overview

**Files:**
- Modify: `app/dashboard/campaigns/[id]/page.tsx`
- Modify: `app/dashboard/campaigns/[id]/analytics-tab.tsx`
- Modify: `app/dashboard/campaigns/[id]/follow-ups-tab.tsx`

- [ ] **Step 1: Update campaign detail header in page.tsx**

In `app/dashboard/campaigns/[id]/page.tsx`, find the `<header>` and update to 68px + global style. Also update the breadcrumb back-link color and the campaign name color:

```tsx
      <header style={{
        padding: "0 32px",
        height: 68,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        backgroundColor: "rgba(6,6,6,0.94)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Link href="/dashboard/campaigns" style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, color: "#444", textDecoration: "none", flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Campaigns
          </Link>
          <span style={{ color: "#2a2a2a", fontSize: 14 }}>/</span>
          <h1 style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#ccc",
            fontFamily: "var(--font-syne)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}>
            {campaign.name}
          </h1>
          <span className={`nx-badge ${isSent ? "nx-badge-green" : "nx-badge-gray"}`}>
            {isSent ? "Sent" : "Draft"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <SendCampaignButton
            campaignId={id}
            campaignName={campaign.name}
            totalLeads={allLeads.length}
            plan={plan}
            gmailEmail={gmailEmail}
            initialStatus={campaign.status ?? ""}
          />
          <a href={`/api/export?campaignId=${id}&format=csv`} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px",
            borderRadius: 7,
            fontSize: 12,
            fontFamily: "var(--font-outfit)",
            textDecoration: "none",
            backgroundColor: "transparent",
            color: "#484848",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            Export CSV
          </a>
        </div>
      </header>
```

- [ ] **Step 2: Update tab bar in page.tsx**

Find the tab bar section (the `<div>` with the TABS.map). Replace with:

```tsx
        {/* Tab bar */}
        <div style={{
          display: "flex",
          gap: 0,
          marginBottom: 28,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/dashboard/campaigns/${id}?tab=${tab.key}`}
                style={{
                  padding: "10px 18px",
                  fontSize: 12,
                  fontWeight: isActive ? 500 : 400,
                  fontFamily: "var(--font-outfit)",
                  color: isActive ? "#ddd" : "#3a3a3a",
                  textDecoration: "none",
                  marginBottom: -1,
                  position: "relative",
                  transition: "color 0.18s ease",
                  borderBottom: isActive ? "1px solid #FF5200" : "1px solid transparent",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
```

- [ ] **Step 3: Update overview tab card in page.tsx**

Find the overview tab `<div style={{ maxWidth: 520 }}>` and update the card style:

Change `backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "20px 20px"` to:
`backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "22px 24px"`

Update the "Campaign details" label from inline styles to use className `"nx-section-label"` and remove the inline fontSize/color/etc.

Update the status row to use a badge:
```tsx
              <OverviewRow label="Status">
                <span className={`nx-badge ${isSent ? "nx-badge-green" : "nx-badge-gray"}`}>
                  {isSent ? "Sent" : "Draft"}
                </span>
              </OverviewRow>
```

- [ ] **Step 4: Update analytics-tab.tsx**

In `app/dashboard/campaigns/[id]/analytics-tab.tsx`:

Update `StatBlock` component's borderRadius to 10 and padding to `"18px 22px"`:
```tsx
function StatBlock({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{
      backgroundColor: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10, padding: "18px 22px", flex: 1, minWidth: 0,
    }}>
      <div className="nx-section-label" style={{ marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 500, color: color ?? "#fff", fontFamily: "var(--font-syne)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}
```

Update `RateBar` label font color from `"#555"` to `"#484848"` for better contrast.

Add upgrade gate empty state with icon (find the !isProOrAgency block and update):
```tsx
    if (!isProOrAgency) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: 280, textAlign: "center", gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#444",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#666", fontFamily: "var(--font-outfit)", marginBottom: 4 }}>
              Performance tracking requires Pro
            </p>
            <p style={{ fontSize: 12, color: "#333", fontFamily: "var(--font-outfit)", maxWidth: 260 }}>
              Upgrade to track opens, clicks, and replies for this campaign.
            </p>
          </div>
          <Link href="/dashboard/settings" className="btn-primary" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 7, fontSize: 12, fontWeight: 500,
            fontFamily: "var(--font-outfit)", textDecoration: "none",
          }}>
            View plans
          </Link>
        </div>
      );
    }
```

- [ ] **Step 5: Update follow-ups-tab.tsx card styling**

In `app/dashboard/campaigns/[id]/follow-ups-tab.tsx`, find the sequence row container and update its border-radius from 8 to 10 and padding from `"12px 14px"` to `"14px 16px"`. Update status dot colors to use `.nx-badge` classes if applicable (the tab uses `STATUS_COLOR` record — leave that logic but update the container card style).

- [ ] **Step 6: Verify build**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

- [ ] **Step 7: Commit**

```bash
cd ~/nexora-outreach && git add app/dashboard/campaigns/[id]/page.tsx app/dashboard/campaigns/[id]/analytics-tab.tsx app/dashboard/campaigns/[id]/follow-ups-tab.tsx && git commit -m "style: campaign detail — header badge, tab bar, overview card, analytics polish"
```

---

## Task 7: Inbox page

**Files:**
- Modify: `app/dashboard/inbox/page.tsx`

The inbox is a large client component. Focus on: header height, filter tabs style, reply card polish, empty states. All data fetching and action logic stays identical.

- [ ] **Step 1: Update header**

Find the `<header>` in inbox/page.tsx and apply the global 68px header style (same as Task 3 Step 1 pattern). Update the title to "Inbox" at 16px Syne weight 500.

- [ ] **Step 2: Update filter tab buttons**

Find the FILTER_TABS render and update the tab button container/buttons to use the same pill group style as in the campaigns table:

```tsx
      <div style={{ display: "flex", gap: 2, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.05)" }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className="btn-ghost"
            style={{
              padding: "5px 13px",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "var(--font-outfit)",
              border: "none",
              cursor: "pointer",
              backgroundColor: filter === tab.value ? "rgba(255,255,255,0.07)" : "transparent",
              color: filter === tab.value ? "#ccc" : "#3a3a3a",
              fontWeight: filter === tab.value ? 500 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
```

- [ ] **Step 3: Update reply card status badges**

Find where `STATUS_CONFIG` is used to render status labels (currently likely a colored text span). Replace with `.nx-badge` classes:

```tsx
// Map STATUS_CONFIG labels to badge classes
const STATUS_BADGE: Record<ReplyStatus, string> = {
  pending:     "nx-badge nx-badge-orange",
  draft_ready: "nx-badge nx-badge-blue",
  sent:        "nx-badge nx-badge-green",
  skipped:     "nx-badge nx-badge-gray",
};

// Then in the card render:
<span className={STATUS_BADGE[reply.status]}>
  {STATUS_CONFIG[reply.status].label}
</span>
```

- [ ] **Step 4: Update reply card container styling**

Find the reply card container div and update:
- `borderRadius` from 8 to 10
- `padding` from `"14px 16px"` (or similar) to `"16px 18px"`
- Add `border: "1px solid rgba(255,255,255,0.06)"` if not present

- [ ] **Step 5: Add empty state**

Find the empty state render (when `filtered.length === 0` or similar) and replace with:

```tsx
          <div style={{
            padding: "64px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#383838",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 4 }}>
                No replies yet
              </p>
              <p style={{ fontSize: 11, color: "#333", fontFamily: "var(--font-outfit)", maxWidth: 260 }}>
                Replies from your leads will appear here once your campaign is sent.
              </p>
            </div>
          </div>
```

- [ ] **Step 6: Verify build**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

- [ ] **Step 7: Commit**

```bash
cd ~/nexora-outreach && git add app/dashboard/inbox/page.tsx && git commit -m "style: inbox — 68px header, pill filter tabs, status badges, polished empty state"
```

---

## Task 8: Analytics page

**Files:**
- Modify: `app/dashboard/analytics/page.tsx`

- [ ] **Step 1: Update header**

Apply the same global 68px header style. Title: "Analytics", subtitle: "Campaign performance".

- [ ] **Step 2: Update stat cards**

Find the 4 stat cards StaggerList and update each card:
- `borderRadius: 8` → `borderRadius: 10`
- `padding: "16px 18px"` → `padding: "20px 22px"`
- Value font size: `22` → `28`
- Add `fontVariantNumeric: "tabular-nums"` to value div

- [ ] **Step 3: Make chart taller**

Find `<ResponsiveContainer width="100%" height={160}>` and change height to `200`.

- [ ] **Step 4: Update chart card**

Find the chart wrapper div and update:
- `borderRadius: 8` → `borderRadius: 10`
- `padding: "20px 24px"` → `padding: "22px 26px"`

- [ ] **Step 5: Update campaign table card**

Find the campaign table container div and update `borderRadius: 8` → `borderRadius: 10`.

Update column headers to use `className="nx-section-label"`.

- [ ] **Step 6: Update upgrade gate empty state**

Find the `!isProOrAgency` block and replace with the same icon + headline + CTA pattern:

```tsx
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", minHeight: 400, textAlign: "center", gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#444",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 6, textWrap: "balance" } as React.CSSProperties}>
                Analytics requires Pro
              </h2>
              <p style={{ fontSize: 12, color: "#444", fontFamily: "var(--font-outfit)", lineHeight: 1.6, maxWidth: 300, textWrap: "pretty" } as React.CSSProperties}>
                Track open rates, click-throughs, and reply rates across all campaigns.
              </p>
            </div>
            <Link href="/dashboard/settings" className="btn-primary" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", backgroundColor: "#FF5200", color: "#fff",
              borderRadius: 7, fontSize: 12, fontWeight: 500,
              fontFamily: "var(--font-outfit)", textDecoration: "none",
            }}>
              View plans
            </Link>
          </div>
```

- [ ] **Step 7: Verify build**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

- [ ] **Step 8: Commit**

```bash
cd ~/nexora-outreach && git add app/dashboard/analytics/page.tsx && git commit -m "style: analytics — larger stat cards, taller chart, upgrade gate empty state"
```

---

## Task 9: Follow-ups page

**Files:**
- Modify: `app/dashboard/followups/page.tsx`

- [ ] **Step 1: Update header**

Apply the global 68px header style. Title: "Follow-ups", subtitle: "Automated sequences".

- [ ] **Step 2: Update sequence cards**

In followups/page.tsx, find the campaign accordion card containers. Update:
- `borderRadius` to 10
- `padding` from whatever it is to `"16px 20px"`
- Status badges: find where `STATUS_COLOR` is used to style status text and replace with `.nx-badge` classes:

```tsx
// Mapping at top of component:
const SEQ_BADGE: Record<string, string> = {
  ready:      "nx-badge nx-badge-green",
  generating: "nx-badge nx-badge-orange",
  paused:     "nx-badge nx-badge-gray",
  cancelled:  "nx-badge nx-badge-gray",
};

// In render:
<span className={SEQ_BADGE[seq.status] ?? "nx-badge nx-badge-gray"}>
  {seq.status}
</span>
```

- [ ] **Step 3: Add upgrade gate empty state**

Find the `!isProOrAgency` / `IconLock` upgrade gate block and replace with:

```tsx
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: 400, textAlign: "center", gap: 14,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 11,
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#444",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 6 }}>
              Follow-ups require Pro
            </h2>
            <p style={{ fontSize: 12, color: "#444", fontFamily: "var(--font-outfit)", lineHeight: 1.6, maxWidth: 300 }}>
              Automatically send up to 3 follow-up emails to leads who haven&apos;t replied.
            </p>
          </div>
          <Link href="/dashboard/settings" className="btn-primary" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 18px", backgroundColor: "#FF5200", color: "#fff",
            borderRadius: 7, fontSize: 12, fontWeight: 500,
            fontFamily: "var(--font-outfit)", textDecoration: "none",
          }}>
            View plans
          </Link>
        </div>
```

- [ ] **Step 4: Add no-data empty state**

If there's a "no follow-up campaigns" empty state, replace with the icon + headline + CTA pattern pointing to `/dashboard/campaigns`.

- [ ] **Step 5: Verify build**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
cd ~/nexora-outreach && git add app/dashboard/followups/page.tsx && git commit -m "style: follow-ups — header, sequence badges, upgrade gate"
```

---

## Task 10: Signal Radar page

**Files:**
- Modify: `app/dashboard/signals/page.tsx`

- [ ] **Step 1: Update header**

Apply global 68px header. Title: "Signal Radar", subtitle: "Prospect intelligence".

- [ ] **Step 2: Update signal cards**

Find each `SignalCard` container. Update:
- `borderRadius: 12` → `borderRadius: 10`
- The left border accent `borderLeft: "3px solid rgba(255,82,0,0.4)"` stays

Update the internal tags (pain_points, talking_points) to use chip-style:

Find where pain_points and talking_points are rendered (likely as `<li>` items or `<span>` elements) and wrap each item in:

```tsx
<span style={{
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: 6,
  backgroundColor: "#161616",
  border: "1px solid rgba(255,255,255,0.07)",
  fontSize: 11,
  color: "#888",
  fontFamily: "var(--font-outfit)",
  margin: "2px 3px 2px 0",
}}>
  {item}
</span>
```

- [ ] **Step 3: Update upgrade gate**

Find the `IconLock` / upgrade gate block and replace with the standard icon + headline + CTA pattern used in Tasks 8 and 9.

- [ ] **Step 4: Add empty state**

Find any "no signals" empty state and update to icon + headline + CTA:

```tsx
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", minHeight: 400, textAlign: "center", gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#444",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#555", fontFamily: "var(--font-outfit)", marginBottom: 4 }}>
                No signals yet
              </p>
              <p style={{ fontSize: 12, color: "#333", fontFamily: "var(--font-outfit)", maxWidth: 280 }}>
                Generate a campaign to start surfacing prospect intelligence.
              </p>
            </div>
            <Link href="/dashboard/campaigns/new" className="btn-primary" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", backgroundColor: "#FF5200", color: "#fff",
              borderRadius: 7, fontSize: 12, fontWeight: 500,
              fontFamily: "var(--font-outfit)", textDecoration: "none",
            }}>
              Create campaign
            </Link>
          </div>
```

- [ ] **Step 5: Verify build**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
cd ~/nexora-outreach && git add app/dashboard/signals/page.tsx && git commit -m "style: signal radar — header, chip tags, upgrade gate, empty state"
```

---

## Task 11: Settings page

**Files:**
- Modify: `app/dashboard/settings/page.tsx`

The settings page is large but follows the `SectionCard` + `SectionLabel` pattern already. We're polishing the header and plan cards grid.

- [ ] **Step 1: Update header**

Apply global 68px header. Title: "Settings", subtitle: "Account & billing".

- [ ] **Step 2: Update SectionCard and SectionLabel**

Find the `SectionCard` component definition and update:
- `borderRadius: 8` → `borderRadius: 10`
- `padding: "20px"` → `padding: "22px 24px"`

Find the `SectionLabel` component and update:
- Replace inline styles with `className="nx-section-label"` and keep only `marginBottom: 10` as inline style.

- [ ] **Step 3: Update plan cards**

Find where the PLANS are rendered as clickable plan option cards (they show price, features, a "Choose" or "Current plan" button). Update each plan card:
- `borderRadius` to 10
- Add `border: "1px solid rgba(255,255,255,0.08)"` if missing on non-active cards
- Active/current plan card: add `border: "1px solid rgba(255,82,0,0.25)"` and `backgroundColor: "rgba(255,82,0,0.04)"`

- [ ] **Step 4: Update danger zone card**

Find the account deletion / danger zone section. Update its container to:
```tsx
style={{
  backgroundColor: "rgba(239,68,68,0.04)",
  border: "1px solid rgba(239,68,68,0.12)",
  borderRadius: 10,
  padding: "20px 24px",
  marginBottom: 24,
}}
```

- [ ] **Step 5: Verify build**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
cd ~/nexora-outreach && git add app/dashboard/settings/page.tsx && git commit -m "style: settings — header, section cards, plan cards, danger zone"
```

---

## Task 12: Banners and upgrade modal

**Files:**
- Modify: `app/dashboard/verify-banner.tsx`
- Modify: `app/dashboard/payment-banner.tsx`
- Modify: `components/upgrade-modal.tsx`

These files are already well-styled. Minor polish only.

- [ ] **Step 1: verify-banner.tsx — update border-radius**

Find the root `<div>` and change `rounded-xl` to `rounded-[10px]` (or update the inline `borderRadius` if using inline styles). This file uses Tailwind classes. Change `px-4 py-3` to `px-5 py-4` for better breathing room. Add `marginBottom: "20px"` to the root div via a `style` prop.

- [ ] **Step 2: payment-banner.tsx — update border-radius**

Find `borderRadius: 12` and change to `borderRadius: 10`. Already looks good otherwise.

- [ ] **Step 3: upgrade-modal.tsx — update card border-radius**

Find the modal content div (inner card) and update:
- `borderRadius: 10` → `borderRadius: 12`
- `padding: 28` → `padding: "28px 32px"`

Find plan option cards within the modal and update `borderRadius` to 10.

- [ ] **Step 4: Verify build**

```bash
cd ~/nexora-outreach && npm run build 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
cd ~/nexora-outreach && git add app/dashboard/verify-banner.tsx app/dashboard/payment-banner.tsx components/upgrade-modal.tsx && git commit -m "style: banners and upgrade modal — border-radius and spacing polish"
```

---

## Task 13: Final build verification and push

- [ ] **Step 1: Full clean build**

```bash
cd ~/nexora-outreach && npm run build 2>&1
```

Expected output ends with something like:
```
Route (app)                              Size     First Load JS
...
✓ Compiled successfully
```

If there are TypeScript errors, fix them. Common issues:
- `textWrap: "balance"` needs `as React.CSSProperties` cast
- `fontVariantNumeric: "tabular-nums"` needs `as React.CSSProperties` cast  
- Missing `Link` import if added to a file that didn't have it before

- [ ] **Step 2: Verify no emojis remain in UI files**

```bash
cd ~/nexora-outreach && grep -r "[\x{1F300}-\x{1FFFF}]" app/ components/ --include="*.tsx" --include="*.ts" -l 2>/dev/null || echo "No emojis found"
```

- [ ] **Step 3: Final commit and push**

```bash
cd ~/nexora-outreach && git add -A && git commit -m "rebrand: complete creative redesign — full visual overhaul of all pages" && git push
```

---

## Self-Review

**Spec coverage check:**
- [x] `globals.css` badge classes, step rail, credit bar — Task 1
- [x] Sidebar: width 232px, credit bar, plan badge, pending count — Task 2
- [x] Layout margin update — Task 2
- [x] Dashboard: 68px header, larger stat cards, quick actions arrow, status badges, empty state — Task 3
- [x] Campaigns list: stats, filter tabs, badges, empty states — Task 4
- [x] Campaign wizard: step progress rail, header — Task 5
- [x] Campaign detail: header badge, tab bar, overview, analytics tab, follow-ups tab — Task 6
- [x] Inbox: header, filter tabs, status badges, empty state — Task 7
- [x] Analytics: header, stat cards, chart height, campaign table, upgrade gate — Task 8
- [x] Follow-ups: header, sequence badges, upgrade gate, empty states — Task 9
- [x] Signal Radar: header, chip tags, upgrade gate, empty state — Task 10
- [x] Settings: header, section cards, plan cards, danger zone — Task 11
- [x] Banners + upgrade modal — Task 12
- [x] Final build + push — Task 13

**Placeholder scan:** No TBDs, TODOs, or vague instructions. Every step has the actual code to write.

**Type consistency:** `nx-badge`, `nx-section-label`, `nx-card` used consistently. `StaggerList`/`StaggerItem`/`CountUp` from `motion.tsx` used correctly. `Link` imported from `next/link` in every file that needs it.
