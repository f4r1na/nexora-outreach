# Nexora Galaxy Dashboard — Design Spec
Date: 2026-05-17

## Overview
Rebuild the entire dashboard with a galaxy/constellation UI — a living outreach universe on the left, an AI command chat on the right. Every sub-page shares the same dark aesthetic. Deploy to Vercel when done.

## Design Language
- Background: #030303 / #050505
- Cards/surfaces: #0a0a0a / #0d0d0d
- Accent orange: #FF6B35
- Accent yellow: #FFD700
- Text: rgba(255,255,255, 0.72) body, #fff headings
- Borders: rgba(255,255,255, 0.05–0.08)
- Border radius: 0–4px max (sharp, not rounded)
- Typography: monospace for labels/data, system-ui for prose
- No emojis anywhere
- No round buttons — rectangular with 0–4px radius
- No colored icon boxes
- Font weights: 400 body, 500–700 headings only

## Layout Shell (all dashboard pages)
```
[ Topbar 38px — Logo | Nav tabs | Status pill | Avatar ]
[ Galaxy Panel 270px ] [ Page Content flex:1          ]
```

### Topbar
- Logo "NEXORA" in #FF6B35, 0.22em letter-spacing
- Nav: Overview / Campaigns / Inbox / Signals / Ghostwriter / Analytics — flat text tabs, active = white + orange underline
- Right: animated status pill (dot + text), avatar initials square
- When agent works: scan shimmer across topbar, logo pulses

### Galaxy Panel (persistent, left side)
- Canvas particle system: 60 ambient dust particles (orange/yellow/white), floating slowly
- Orb nodes positioned absolutely:
  - Orange orbs (large, 12–20px): active campaigns — pulse rings, glow
  - Yellow orbs (medium, 7–10px): detected signals — softer glow
  - White orbs (tiny, 4–5px): individual prospects
- SVG constellation lines between related orbs (dashed, rgba(255,107,53,0.09))
- Nebula gradient background behind orbs
- Panel label: "Your Outreach Universe" (monospace, faint)
- Legend at bottom: orange=campaigns, yellow=signals, white=prospects
- Agent working state:
  - Scan line sweeps top→bottom
  - All orb float animations 3x faster
  - Orb glows intensify
  - Stream particles fly INTO campaign orbs from edges, leaving trails
  - Status bar slides up showing rotating task text
  - Nebula breathes/pulses

## Page: Overview (Dashboard Home)
Right side = full-height AI chat interface.

### Chat area
- Date marker at top
- AI messages: avatar square "NX" | name + time | prose text
- Inline data cards embedded in AI messages (signal tables, draft cards)
- User messages: right-aligned, orange-tinted border
- Thinking indicator: avatar + animated task text + bouncing dots
- Smooth scroll, thin scrollbar

### Input bar
- Context tag row: Signals / Campaigns / Inbox / Ghostwriter / Analytics / Settings / Export — toggle active state
- Textarea input (sharp, full-width)
- Arrow send button (rectangular)
- Hint text below

### Agent working triggers
- "Draft emails for all 3" button in signal card
- Any user message sent
- Starts: galaxy animates, thinking indicator appears, status pill flips
- Ends: result card injected into chat, galaxy calms

## Page: Campaigns
- Table/list of campaigns with status dots (not badges)
- Each row: campaign name, leads count, reply rate, status, actions
- "New Campaign" button top-right (rectangular, orange border)
- Click row → campaign detail with tabs: Overview / Leads / Follow-ups / Analytics
- Wizard for new campaign: 3 steps inline, no modal

## Page: Inbox
- Split: reply list left (30%) | reply detail right (70%)
- Each reply item: sender name, snippet, time, status dot
- Detail: full email thread, AI draft suggestion at bottom
- "Send" / "Edit" / "Archive" actions — rectangular buttons

## Page: Signals
- Grid of signal cards: company, signal type, score bar, detected date
- Filter bar: All / Funding / Hiring / Launch / Expansion
- Click card → expanded detail with AI-generated context
- Score displayed as a thin horizontal bar (orange fill)

## Page: Ghostwriter
- Upload/paste writing samples
- Style analysis readout (monospace stats)
- "Analyze style" runs agent animation
- Generated profile shown as key-value pairs

## Page: Analytics
- Full-width charts using recharts
- Reply rate over time (area chart, orange fill)
- Top campaigns by performance (bar chart)
- Signal source breakdown (horizontal bars, no pie)
- Stats row at top: 4 key numbers

## Page: Settings
- Sections: Email, Plan, Account, Sign out
- Gmail connection status with connect/disconnect
- Plan upgrade cards (rectangular, no glow badges)
- Danger zone at bottom for delete account

## Animation System
All animations defined in globals.css as @keyframes. Components use CSS classes not inline style animations. Agent working state controlled by a React context (AgentContext) with `isWorking: boolean` and `taskText: string`.

## Deployment
- `vercel.json` already exists — no changes needed
- Environment variables already in .env.local
- `npm run build` must pass (0 TypeScript errors) before deploy
- Deploy: `vercel --prod`

## File Structure
```
app/dashboard/
  layout.tsx          — shell: topbar + galaxy panel + children
  page.tsx            — overview: chat interface
  _components/
    galaxy-panel.tsx  — canvas + orbs + SVG lines
    chat-area.tsx     — message list + input bar
    topbar.tsx        — nav + status pill
    data-card.tsx     — reusable inline data table
    draft-card.tsx    — reusable email draft display
  campaigns/
    page.tsx
    new/page.tsx
    [id]/page.tsx
  inbox/page.tsx
  signals/page.tsx
  ghostwriter/page.tsx
  analytics/page.tsx
  settings/page.tsx
contexts/
  agent-context.tsx   — isWorking, taskText, startWork, stopWork
```
