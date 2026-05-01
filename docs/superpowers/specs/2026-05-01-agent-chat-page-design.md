# Agent Chat Page Design

**Date:** 2026-05-01
**Route:** `/dashboard/agent` + `/dashboard/agent/[chatId]`
**Status:** Approved

---

## Overview

A dedicated 2-column persistent chat page at `/dashboard/agent`. The existing dashboard home (`/dashboard`) is unchanged - it remains the single-turn quick-action launcher. This page is the full conversational experience: multi-turn, history-aware, with a context sidebar. Accessible via a "Chat" link added to the dashboard navbar.

---

## Architecture

### Routes

```
/dashboard/agent            - redirects to /dashboard/agent/<new-uuid>
/dashboard/agent/[chatId]   - the chat page (chatId is a client-generated UUID)
```

Both are Server Components. They handle auth (redirect to `/login` if no user) and pass `userId` + `chatId` as props to the client root component.

### File Structure

```
app/dashboard/agent/
├── page.tsx                     Server Component - generates UUID, redirects to [chatId]
├── [chatId]/
│   └── page.tsx                 Server Component - auth check, passes userId + chatId
└── _components/
    ├── ChatInterface.tsx         "use client" - owns all state, useChat hook
    ├── MessageList.tsx           renders message bubbles, auto-scrolls to bottom
    ├── MessageBubble.tsx         user (right) vs agent (left), typewriter on agent
    ├── AgentAvatar.tsx           24px circle, pulsing orange glow when isLoading
    ├── InputArea.tsx             pill textarea, send button with spring animation
    ├── Sidebar.tsx               collapsible desktop / modal mobile
    ├── ContextPanel.tsx          active campaign card with progress bar
    ├── QuickActions.tsx          4 action buttons (view analytics, check inbox, new campaign, follow-ups)
    ├── RecentChats.tsx           recent chat list from localStorage
    └── CopyButton.tsx            icon-only, swaps to green checkmark on copy

app/api/chat/
└── route.ts                     POST - Vercel AI SDK streamText + Anthropic
```

### Server/Client Boundary

- `page.tsx` files: Server Components only - auth, no interactivity
- `ChatInterface.tsx`: single "use client" root - everything interactive lives inside it
- No data fetching in client components; the AI SDK handles streaming through the API route

### Navbar Change

One addition to `app/dashboard/_components/navbar.tsx`: add "Chat" to the `NAV` array pointing to `/dashboard/agent`.

---

## API Layer

### `POST /api/chat`

**Request:**
```json
{ "messages": [{ "role": "user"|"assistant", "content": "..." }], "id": "<chatId>" }
```

**Auth:** Supabase `createClient()` - returns 401 if no user.

**Rate limit:** 10 requests / 60s per user (in-memory Map, same pattern as `/api/agent`).

**Implementation:**
```ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
```

- Fetches company profile from Supabase for system prompt context
- Model: `claude-sonnet-4-6`, temperature: 0.7, maxTokens: 2000
- System prompt: Nexora agent persona, knows campaigns/inbox/analytics/signals/follow-ups, company context injected when available
- Returns `result.toDataStreamResponse()`

**Packages to install:**
```bash
npm install ai @ai-sdk/anthropic
```

---

## Client State & Persistence

### `useChat` hook (`ai/react`)

```ts
const { messages, input, handleSubmit, isLoading, setMessages } = useChat({
  api: '/api/chat',
  id: chatId,
  initialMessages: loadFromStorage(chatId),
  onFinish: () => saveToStorage(chatId, messages),
});
```

### localStorage schema

Key: `nexora_chat_${chatId}`

```json
{
  "id": "<uuid>",
  "title": "<first user message, truncated to 60 chars>",
  "createdAt": "<ISO string>",
  "messages": [{ "id": "...", "role": "user"|"assistant", "content": "..." }]
}
```

Index key: `nexora_chat_index` - array of `{ id, title, createdAt }` sorted newest first, max 20 entries. Oldest entry pruned when limit is exceeded.

### New chat flow

`/dashboard/agent/page.tsx` generates a UUID with `import { randomUUID } from 'crypto'` (Node.js, available in Next.js Server Components) and immediately redirects to `/dashboard/agent/<uuid>`. No localStorage entry created until the first message is sent.

---

## Components

### ChatInterface

- Owns `useChat` hook
- Renders 2-column layout: chat (55%) + sidebar (45%)
- Passes `isLoading` down to `AgentAvatar` and `MessageList`
- Sidebar open state: `useState(true)` on desktop, `useState(false)` on mobile (detected via `useEffect` + `window.innerWidth`)

### MessageBubble

- **User:** right-aligned, `rgba(255,82,0,0.12)` background, `border-radius: 12px 4px 12px 12px`
- **Agent:** left-aligned, `rgba(255,255,255,0.05)` background, `border-radius: 4px 12px 12px 12px`
- Agent bubble uses `useTypewriter` hook on last message only (when `!isLoading` and message is last in array)
- Includes `CopyButton` bottom-right of each agent message

### AgentAvatar

- 24px circle, gradient `#FF5200 -> #F59E0B`
- While `isLoading`: `animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 0px ...', '0 0 16px rgba(255,82,0,0.5)', '0 0 0px ...'] }}` with `repeat: Infinity, duration: 1.2`
- Idle: static

### InputArea

- Full-width pill (`border-radius: 999px`)
- `<textarea>` inside, auto-resizes up to 5 lines
- Send button: `whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`, spring `{ stiffness: 400, damping: 17 }`
- Focus state: `boxShadow: '0 0 0 3px rgba(255,82,0,0.2)'`, transition 200ms
- Disabled + gray when `isLoading`

### Sidebar

- **Desktop:** right column, `flex: 0 0 45%`, collapse animates `width: 0` with `AnimatePresence`. Toggle button with chevron rotating 180deg.
- **Mobile (<768px):** `position: fixed, inset: 0`, slides up from bottom with `y: '100%' -> 0`, backdrop `rgba(0,0,0,0.6)`. `Escape` key closes it.
- Contains: `ContextPanel`, `QuickActions`, `RecentChats`

### ContextPanel

- `ChatInterface` fetches `GET /api/campaigns/list?status=active&limit=1` on mount, passes result as prop
- Falls back to "No active campaign" state with a "New campaign" link if fetch returns empty or fails
- Progress bar: orange gradient, shows `emails_sent / lead_count` percentage

### QuickActions

Four buttons (no emojis, icon-only from lucide-react):
- `BarChart2` - "View analytics" - sends "Show me my analytics" as a message
- `Inbox` - "Check inbox" - sends "Check my inbox"
- `Plus` - "New campaign" - navigates to `/dashboard/campaigns/new`
- `Repeat` - "Follow-ups" - sends "Show my follow-ups"

### RecentChats

- Reads `nexora_chat_index` from localStorage on mount
- Active chat highlighted with orange-tinted background
- Click navigates to `/dashboard/agent/<chatId>`
- "New chat" button at top navigates to `/dashboard/agent` (triggers new UUID)

### CopyButton

- `navigator.clipboard.writeText(message.content)`
- On success: swap `Copy` icon to `Check` (green `#00D084`), revert after 2000ms
- No toast - the icon change is sufficient feedback

---

## Animations

All gated by `useReducedMotion()` - if true, skip all motion.

| Element | Animation | Duration / Config |
|---|---|---|
| Page load - header | `y: 16 -> 0, opacity: 0 -> 1` | 400ms, delay 0ms |
| Page load - chat col | `y: 16 -> 0, opacity: 0 -> 1` | 400ms, delay 100ms |
| Page load - sidebar | `y: 16 -> 0, opacity: 0 -> 1` | 400ms, delay 200ms |
| User message | `x: 20 -> 0, opacity: 0 -> 1` | spring, stiffness 300, damping 24 |
| Agent message | `x: -20 -> 0, opacity: 0 -> 1` | spring, stiffness 300, damping 24 |
| Typewriter | 18ms per character via interval | last agent message only |
| Agent avatar (thinking) | scale + glow pulse, `repeat: Infinity` | 1.2s cycle |
| Send button hover/tap | `scale: 1.05` / `scale: 0.95` | spring, stiffness 400, damping 17 |
| Input focus ring | `boxShadow` transition | 200ms ease |
| Sidebar collapse (desktop) | `width: 0` | 300ms ease-in-out |
| Sidebar chevron | `rotate: 0 -> 180deg` | 300ms ease |
| Sidebar open (mobile) | `y: 100% -> 0` | 350ms ease-out |
| Copy -> check icon | opacity crossfade | 150ms |

---

## Accessibility

- `<main role="main">` wraps the chat column
- Message list: `role="log" aria-live="polite" aria-label="Conversation"`
- While loading: `aria-busy="true"` on the message list
- Sidebar toggle: `aria-expanded`, `aria-controls="agent-sidebar"`, `aria-label="Toggle sidebar"`
- Copy button: `aria-label="Copy message"` - changes to `"Message copied"` for 2s after copy
- All interactive elements are native `<button>` or `<textarea>` - no div click handlers
- `Escape` closes mobile sidebar modal
- Minimum touch target: 48px on mobile for all buttons

---

## Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| 1200px+ | Full 2-column, sidebar always visible |
| 768-1199px | 2-column, sidebar collapsible (toggle button visible) |
| <768px | Single column chat, sidebar as full-screen modal |

---

## Design Tokens

Consistent with existing codebase:

- Background: `#080810`
- Card: `rgba(255,255,255,0.05)`, border `rgba(255,255,255,0.08)`
- Accent orange: `#FF5200`
- Accent green: `#00D084`
- Text primary: `#fff`
- Text muted: `rgba(255,255,255,0.55)`
- Font: `var(--font-outfit)` body, `var(--font-space-grotesk)` headings
- Border radius: 6-8px cards, 999px pills
- No emojis anywhere

---

## Testing

- Unit: `useTypewriter` hook, localStorage read/write helpers, `CopyButton` copy + icon swap
- Integration: send message -> stream response -> message appears, sidebar toggle open/close, new chat navigation
- Accessibility: keyboard Tab order through all interactive elements, Escape closes modal
- Reduced motion: confirm all animations skip when `prefers-reduced-motion: reduce`

---

## Out of Scope

- DB persistence (localStorage only for now)
- Export conversation (PDF/CSV) - deferred
- Message search
- Conversation sharing/deep links to specific messages
