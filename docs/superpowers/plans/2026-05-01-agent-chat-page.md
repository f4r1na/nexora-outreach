# Agent Chat Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 2-column multi-turn chat page at `/dashboard/agent/[chatId]` with streaming AI responses via Vercel AI SDK, localStorage persistence, animated sidebar, and full WCAG AA accessibility.

**Architecture:** Two Server Component routes handle auth and UUID generation. A single `"use client"` `ChatInterface` component owns all state via `useChat` from `ai/react`. Streaming responses come from `POST /api/chat` using `streamText` + Anthropic. Chat history persists to `localStorage` per chatId with a 20-entry index. The `key={chatId}` prop on `ChatInterface` forces a full remount when navigating between chats, ensuring `initialMessages` is re-read from localStorage.

**Tech Stack:** Next.js 16 App Router, Vercel AI SDK v4 (`ai`, `@ai-sdk/anthropic`), Framer Motion 12, Supabase, lucide-react, Jest + React Testing Library

---

## File Map

**Create:**
- `app/dashboard/agent/page.tsx` - auth check, generates UUID, redirects to `[chatId]`
- `app/dashboard/agent/[chatId]/page.tsx` - auth check, renders `<ChatInterface key={chatId} />`
- `app/dashboard/agent/_components/ChatInterface.tsx` - owns `useChat`, all layout state
- `app/dashboard/agent/_components/MessageList.tsx` - `role="log"` list, auto-scroll
- `app/dashboard/agent/_components/MessageBubble.tsx` - user/agent bubbles with spring animation
- `app/dashboard/agent/_components/AgentAvatar.tsx` - 28px circle, pulsing glow when loading
- `app/dashboard/agent/_components/InputArea.tsx` - pill textarea, spring send button
- `app/dashboard/agent/_components/Sidebar.tsx` - collapsible desktop / bottom-sheet mobile
- `app/dashboard/agent/_components/ContextPanel.tsx` - fetches active campaign, progress bar
- `app/dashboard/agent/_components/QuickActions.tsx` - 4 Lucide icon buttons, no emojis
- `app/dashboard/agent/_components/RecentChats.tsx` - localStorage chat index list
- `app/dashboard/agent/_components/CopyButton.tsx` - Copy-to-Check icon swap
- `app/dashboard/agent/_hooks/useTypewriter.ts` - character-by-character animation
- `app/dashboard/agent/_lib/types.ts` - shared TypeScript interfaces
- `app/dashboard/agent/_lib/storage.ts` - localStorage read/write helpers
- `app/api/chat/route.ts` - POST, `streamText`, Anthropic, rate limiting
- `app/api/campaigns/active/route.ts` - GET, returns most recent active campaign
- `__tests__/agent-chat/storage.test.ts` - unit tests for storage helpers
- `__tests__/agent-chat/useTypewriter.test.ts` - unit tests for typewriter hook
- `__tests__/agent-chat/CopyButton.test.tsx` - unit tests for copy + icon swap

**Modify:**
- `app/dashboard/_components/navbar.tsx` - add "Chat" to NAV array between Agent and Campaigns

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install Vercel AI SDK packages**

```bash
npm install ai @ai-sdk/anthropic
```

Expected: packages added without errors. `package.json` now lists `"ai"` and `"@ai-sdk/anthropic"`.

- [ ] **Step 2: Verify installation**

```bash
node -e "require('ai'); require('@ai-sdk/anthropic'); console.log('OK')"
```

Expected output: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Vercel AI SDK (ai, @ai-sdk/anthropic)"
```

---

### Task 2: Types

**Files:**
- Create: `app/dashboard/agent/_lib/types.ts`

- [ ] **Step 1: Create types file**

```ts
// app/dashboard/agent/_lib/types.ts
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatEntry {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface ChatIndexEntry {
  id: string;
  title: string;
  createdAt: string;
}

export interface ActiveCampaign {
  id: string;
  name: string;
  lead_count: number;
  emails_sent: number;
  status: string;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/agent/_lib/types.ts
git commit -m "feat: add agent chat types"
```

---

### Task 3: Storage library + tests

**Files:**
- Create: `app/dashboard/agent/_lib/storage.ts`
- Create: `__tests__/agent-chat/storage.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/agent-chat/storage.test.ts
import { loadChat, saveChat, loadIndex, deleteChat } from '@/app/dashboard/agent/_lib/storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadChat', () => {
    it('returns empty array when no chat exists', () => {
      expect(loadChat('nonexistent')).toEqual([]);
    });

    it('returns messages after saving', () => {
      const messages = [{ id: '1', role: 'user' as const, content: 'hello' }];
      saveChat('chat-1', messages);
      expect(loadChat('chat-1')).toEqual(messages);
    });
  });

  describe('saveChat', () => {
    it('saves title from first user message, truncated to 60 chars', () => {
      const longContent = 'a'.repeat(80);
      saveChat('chat-1', [{ id: '1', role: 'user' as const, content: longContent }]);
      expect(loadIndex()[0].title).toHaveLength(60);
    });

    it('updates index with newest chat first', () => {
      saveChat('chat-1', [{ id: '1', role: 'user' as const, content: 'First' }]);
      saveChat('chat-2', [{ id: '2', role: 'user' as const, content: 'Second' }]);
      const index = loadIndex();
      expect(index[0].id).toBe('chat-2');
      expect(index[1].id).toBe('chat-1');
    });

    it('prunes index to 20 entries', () => {
      for (let i = 0; i < 25; i++) {
        saveChat(`chat-${i}`, [{ id: '1', role: 'user' as const, content: `Message ${i}` }]);
      }
      expect(loadIndex()).toHaveLength(20);
    });

    it('preserves createdAt on re-save', () => {
      saveChat('chat-1', [{ id: '1', role: 'user' as const, content: 'hi' }]);
      const first = loadIndex()[0].createdAt;
      saveChat('chat-1', [
        { id: '1', role: 'user' as const, content: 'hi' },
        { id: '2', role: 'assistant' as const, content: 'reply' },
      ]);
      expect(loadIndex()[0].createdAt).toBe(first);
    });
  });

  describe('deleteChat', () => {
    it('removes chat data and index entry', () => {
      saveChat('chat-1', [{ id: '1', role: 'user' as const, content: 'hi' }]);
      deleteChat('chat-1');
      expect(loadChat('chat-1')).toEqual([]);
      expect(loadIndex()).toHaveLength(0);
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- __tests__/agent-chat/storage.test.ts --no-coverage
```

Expected: FAIL with "Cannot find module '@/app/dashboard/agent/_lib/storage'"

- [ ] **Step 3: Implement storage library**

```ts
// app/dashboard/agent/_lib/storage.ts
import { ChatEntry, ChatIndexEntry, ChatMessage } from './types';

const CHAT_PREFIX = 'nexora_chat_';
const INDEX_KEY = 'nexora_chat_index';
const MAX_CHATS = 20;

export function loadChat(chatId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${CHAT_PREFIX}${chatId}`);
    if (!raw) return [];
    const entry: ChatEntry = JSON.parse(raw);
    return entry.messages ?? [];
  } catch {
    return [];
  }
}

export function saveChat(chatId: string, messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  const index = loadIndex();
  const existing = index.find((e) => e.id === chatId);
  const firstUserMsg = messages.find((m) => m.role === 'user');
  const title = firstUserMsg ? firstUserMsg.content.slice(0, 60) : 'New chat';
  const createdAt = existing?.createdAt ?? new Date().toISOString();

  const entry: ChatEntry = { id: chatId, title, createdAt, messages };
  localStorage.setItem(`${CHAT_PREFIX}${chatId}`, JSON.stringify(entry));
  _updateIndex({ id: chatId, title, createdAt });
}

export function loadIndex(): ChatIndexEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatIndexEntry[];
  } catch {
    return [];
  }
}

export function deleteChat(chatId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${CHAT_PREFIX}${chatId}`);
  const updated = loadIndex().filter((e) => e.id !== chatId);
  localStorage.setItem(INDEX_KEY, JSON.stringify(updated));
}

function _updateIndex(entry: ChatIndexEntry): void {
  const filtered = loadIndex().filter((e) => e.id !== entry.id);
  const updated = [entry, ...filtered].slice(0, MAX_CHATS);
  localStorage.setItem(INDEX_KEY, JSON.stringify(updated));
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- __tests__/agent-chat/storage.test.ts --no-coverage
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/agent/_lib/storage.ts __tests__/agent-chat/storage.test.ts
git commit -m "feat: add agent chat storage library with tests"
```

---

### Task 4: useTypewriter hook + tests

**Files:**
- Create: `app/dashboard/agent/_hooks/useTypewriter.ts`
- Create: `__tests__/agent-chat/useTypewriter.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/agent-chat/useTypewriter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from '@/app/dashboard/agent/_hooks/useTypewriter';

describe('useTypewriter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns full text immediately when active is false', () => {
    const { result } = renderHook(() => useTypewriter('hello world', false));
    expect(result.current).toBe('hello world');
  });

  it('starts empty when active is true', () => {
    const { result } = renderHook(() => useTypewriter('abc', true));
    expect(result.current).toBe('');
  });

  it('reveals one character per 18ms when active', () => {
    const { result } = renderHook(() => useTypewriter('abc', true));
    act(() => { jest.advanceTimersByTime(18); });
    expect(result.current).toBe('a');
    act(() => { jest.advanceTimersByTime(18); });
    expect(result.current).toBe('ab');
    act(() => { jest.advanceTimersByTime(18); });
    expect(result.current).toBe('abc');
  });

  it('completes at full text length and stops advancing', () => {
    const { result } = renderHook(() => useTypewriter('hi', true));
    act(() => { jest.advanceTimersByTime(18 * 20); });
    expect(result.current).toBe('hi');
  });

  it('returns full text immediately when active is false from the start', () => {
    const { result } = renderHook(() => useTypewriter('test content', false));
    expect(result.current).toBe('test content');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- __tests__/agent-chat/useTypewriter.test.ts --no-coverage
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement the hook**

```ts
// app/dashboard/agent/_hooks/useTypewriter.ts
import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function useTypewriter(text: string, active: boolean): string {
  const prefersReduced = useReducedMotion();
  const [displayed, setDisplayed] = useState(active && !prefersReduced ? '' : text);

  useEffect(() => {
    if (!active || prefersReduced) {
      setDisplayed(text);
      return;
    }
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [text, active, prefersReduced]);

  return displayed;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- __tests__/agent-chat/useTypewriter.test.ts --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/agent/_hooks/useTypewriter.ts __tests__/agent-chat/useTypewriter.test.ts
git commit -m "feat: add useTypewriter hook with tests"
```

---

### Task 5: `/api/campaigns/active` route

**Files:**
- Create: `app/api/campaigns/active/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/campaigns/active/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name, lead_count, emails_sent, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return NextResponse.json({ campaign: null });
  return NextResponse.json({ campaign: data });
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no errors in this file.

- [ ] **Step 3: Commit**

```bash
git add app/api/campaigns/active/route.ts
git commit -m "feat: add /api/campaigns/active route"
```

---

### Task 6: `/api/chat` streaming route

**Files:**
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/chat/route.ts
import { createClient } from "@/lib/supabase/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const _rl = new Map<string, { n: number; reset: number }>();
function isRateLimited(uid: string): boolean {
  const now = Date.now();
  const e = _rl.get(uid);
  if (!e || now > e.reset) { _rl.set(uid, { n: 1, reset: now + 60_000 }); return false; }
  if (e.n >= 10) return true;
  e.n++;
  return false;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (isRateLimited(user.id)) return new Response("Too Many Requests", { status: 429 });

  const { messages } = await req.json();

  const { data: profile } = await supabase
    .from("company_profiles")
    .select("company_name, industry, target_audience, value_proposition")
    .eq("user_id", user.id)
    .single();

  const companyCtx = profile
    ? ` Company: ${profile.company_name}. Industry: ${profile.industry}. Target audience: ${profile.target_audience}. Value: ${profile.value_proposition}.`
    : "";

  const result = await streamText({
    model: anthropic("claude-sonnet-4-6"),
    temperature: 0.7,
    maxTokens: 2000,
    system: `You are the Nexora AI agent - a focused assistant for cold email outreach. You help with campaigns, leads, analytics, inbox management, and follow-ups. Be concise and direct. No filler phrases.${companyCtx}`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no errors in this file.

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: add /api/chat streaming route with Vercel AI SDK"
```

---

### Task 7: CopyButton component + tests

**Files:**
- Create: `app/dashboard/agent/_components/CopyButton.tsx`
- Create: `__tests__/agent-chat/CopyButton.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// __tests__/agent-chat/CopyButton.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from '@/app/dashboard/agent/_components/CopyButton';

describe('CopyButton', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with "Copy message" aria-label', () => {
    render(<CopyButton text="hello" />);
    expect(screen.getByRole('button', { name: 'Copy message' })).toBeInTheDocument();
  });

  it('calls clipboard.writeText with the provided text', async () => {
    render(<CopyButton text="test content" />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy message' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test content');
  });

  it('changes aria-label to "Message copied" after copy', async () => {
    render(<CopyButton text="hello" />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy message' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Message copied' })).toBeInTheDocument();
    });
  });

  it('reverts aria-label to "Copy message" after 2000ms', async () => {
    render(<CopyButton text="hello" />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy message' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Message copied' })).toBeInTheDocument();
    });
    jest.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copy message' })).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- __tests__/agent-chat/CopyButton.test.tsx --no-coverage
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement CopyButton**

```tsx
// app/dashboard/agent/_components/CopyButton.tsx
"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? "Message copied" : "Copy message"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 4,
        color: copied ? "#00D084" : "rgba(255,255,255,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color 150ms",
        minWidth: 48,
        minHeight: 48,
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- __tests__/agent-chat/CopyButton.test.tsx --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/agent/_components/CopyButton.tsx __tests__/agent-chat/CopyButton.test.tsx
git commit -m "feat: add CopyButton component with tests"
```

---

### Task 8: AgentAvatar component

**Files:**
- Create: `app/dashboard/agent/_components/AgentAvatar.tsx`

- [ ] **Step 1: Create AgentAvatar**

```tsx
// app/dashboard/agent/_components/AgentAvatar.tsx
"use client";
import { motion, useReducedMotion } from "framer-motion";

export function AgentAvatar({ isLoading }: { isLoading: boolean }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      animate={
        isLoading && !prefersReduced
          ? {
              scale: [1, 1.08, 1],
              boxShadow: [
                "0 0 0px rgba(255,82,0,0)",
                "0 0 16px rgba(255,82,0,0.5)",
                "0 0 0px rgba(255,82,0,0)",
              ],
            }
          : { scale: 1, boxShadow: "0 0 0px rgba(255,82,0,0)" }
      }
      transition={
        isLoading && !prefersReduced
          ? { repeat: Infinity, duration: 1.2 }
          : {}
      }
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #FF5200, #F59E0B)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        color: "#fff",
        fontFamily: "var(--font-space-grotesk)",
      }}
    >
      N
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/agent/_components/AgentAvatar.tsx
git commit -m "feat: add AgentAvatar component"
```

---

### Task 9: InputArea component

**Files:**
- Create: `app/dashboard/agent/_components/InputArea.tsx`

- [ ] **Step 1: Create InputArea**

```tsx
// app/dashboard/agent/_components/InputArea.tsx
"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { ChangeEvent, FormEvent, KeyboardEvent, useRef, useState } from "react";

interface InputAreaProps {
  input: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function InputArea({ input, onChange, onSubmit, isLoading }: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const prefersReduced = useReducedMotion();
  const canSend = !isLoading && input.trim().length > 0;

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSubmit(e as unknown as FormEvent<HTMLFormElement>);
      }
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 999,
          padding: "8px 8px 8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: focused ? "0 0 0 3px rgba(255,82,0,0.2)" : "none",
          transition: "box-shadow 200ms ease",
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onChange}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask anything about your outreach..."
          disabled={isLoading}
          rows={1}
          aria-label="Message input"
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: isLoading ? "rgba(255,255,255,0.4)" : "#fff",
            fontSize: 14,
            fontFamily: "var(--font-outfit)",
            resize: "none",
            maxHeight: 120,
            overflowY: "auto",
            lineHeight: 1.5,
          }}
        />
        <motion.button
          type="submit"
          disabled={!canSend}
          whileHover={canSend && !prefersReduced ? { scale: 1.05 } : {}}
          whileTap={canSend && !prefersReduced ? { scale: 0.95 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          aria-label="Send message"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: canSend ? "#FF5200" : "rgba(255,255,255,0.08)",
            border: "none",
            cursor: canSend ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0,
            transition: "background 150ms ease",
          }}
        >
          <ArrowUp size={16} />
        </motion.button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/agent/_components/InputArea.tsx
git commit -m "feat: add InputArea component"
```

---

### Task 10: MessageBubble component

**Files:**
- Create: `app/dashboard/agent/_components/MessageBubble.tsx`

- [ ] **Step 1: Create MessageBubble**

```tsx
// app/dashboard/agent/_components/MessageBubble.tsx
"use client";
import { motion, useReducedMotion } from "framer-motion";
import { AgentAvatar } from "./AgentAvatar";
import { CopyButton } from "./CopyButton";
import { useTypewriter } from "../_hooks/useTypewriter";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isFresh: boolean;
  isLast: boolean;
  isLoading: boolean;
}

function AgentContent({ content, active }: { content: string; active: boolean }) {
  const text = useTypewriter(content, active);
  return <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>;
}

export function MessageBubble({
  role,
  content,
  isFresh,
  isLast,
  isLoading,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? false : { x: isUser ? 20 : -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      {!isUser && <AgentAvatar isLoading={isLoading && isLast} />}
      <div
        style={{
          maxWidth: "75%",
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            background: isUser ? "rgba(255,82,0,0.12)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${isUser ? "rgba(255,82,0,0.2)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
            padding: "8px 12px",
            fontSize: 14,
            color: isUser ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.82)",
            lineHeight: 1.6,
            fontFamily: "var(--font-outfit)",
          }}
        >
          {isUser ? (
            <span style={{ whiteSpace: "pre-wrap" }}>{content}</span>
          ) : (
            <AgentContent
              content={content}
              active={isFresh && isLast && !isLoading}
            />
          )}
        </div>
        {!isUser && (
          <div style={{ marginTop: 2 }}>
            <CopyButton text={content} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/agent/_components/MessageBubble.tsx
git commit -m "feat: add MessageBubble component"
```

---

### Task 11: MessageList component

**Files:**
- Create: `app/dashboard/agent/_components/MessageList.tsx`

- [ ] **Step 1: Create MessageList**

```tsx
// app/dashboard/agent/_components/MessageList.tsx
"use client";
import { Message } from "ai";
import { useEffect, useRef } from "react";
import { AgentAvatar } from "./AgentAvatar";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  freshMessageIds: Set<string>;
}

export function MessageList({ messages, isLoading, freshMessageIds }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const showThinking =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "user";

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Conversation"
      aria-busy={isLoading}
      style={{
        flex: 1,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflowY: "auto",
      }}
    >
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          role={msg.role as "user" | "assistant"}
          content={msg.content}
          isFresh={freshMessageIds.has(msg.id)}
          isLast={i === messages.length - 1}
          isLoading={isLoading}
        />
      ))}
      {showThinking && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <AgentAvatar isLoading={true} />
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "4px 12px 12px 12px",
              padding: "12px 16px",
              display: "flex",
              gap: 5,
              alignItems: "center",
            }}
          >
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.4)",
                  display: "inline-block",
                  animation: "wiz-think 1.2s ease-in-out infinite",
                  animationDelay: `${dot * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/agent/_components/MessageList.tsx
git commit -m "feat: add MessageList component"
```

---

### Task 12: ContextPanel component

**Files:**
- Create: `app/dashboard/agent/_components/ContextPanel.tsx`

- [ ] **Step 1: Create ContextPanel**

```tsx
// app/dashboard/agent/_components/ContextPanel.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ActiveCampaign } from "../_lib/types";

export function ContextPanel() {
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns/active")
      .then((r) => r.json())
      .then((data) => {
        setCampaign(data.campaign ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 8,
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          className="skeleton"
          style={{ height: 10, width: "55%", borderRadius: 4 }}
        />
        <div
          className="skeleton"
          style={{ height: 14, width: "75%", borderRadius: 4 }}
        />
        <div
          className="skeleton"
          style={{ height: 8, width: "40%", borderRadius: 4 }}
        />
        <div className="skeleton" style={{ height: 3, borderRadius: 999 }} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 8,
          padding: 10,
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.35)",
            marginBottom: 8,
            fontFamily: "var(--font-outfit)",
          }}
        >
          No active campaign
        </p>
        <Link
          href="/dashboard/campaigns/new"
          style={{ fontSize: 12, color: "#FF5200", textDecoration: "none" }}
        >
          Start a campaign
        </Link>
      </div>
    );
  }

  const pct =
    campaign.lead_count > 0
      ? Math.round((campaign.emails_sent / campaign.lead_count) * 100)
      : 0;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
        padding: 10,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#fff",
          marginBottom: 4,
          fontFamily: "var(--font-space-grotesk)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {campaign.name}
      </p>
      <div
        style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}
      >
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          {campaign.lead_count} leads
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>·</span>
        <span style={{ fontSize: 11, color: "#4ade80" }}>{campaign.status}</span>
      </div>
      <div
        style={{
          height: 3,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 4,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "linear-gradient(90deg, #FF5200, #F59E0B)",
            borderRadius: 999,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
          {pct}% sent
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
          {campaign.emails_sent} / {campaign.lead_count}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/agent/_components/ContextPanel.tsx
git commit -m "feat: add ContextPanel component"
```

---

### Task 13: QuickActions component

**Files:**
- Create: `app/dashboard/agent/_components/QuickActions.tsx`

- [ ] **Step 1: Create QuickActions**

```tsx
// app/dashboard/agent/_components/QuickActions.tsx
"use client";
import { BarChart2, Inbox, Plus, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionsProps {
  onSend: (message: string) => void;
}

type Action = {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  message?: string;
  href?: string;
};

const ACTIONS: Action[] = [
  { icon: BarChart2, label: "View analytics", message: "Show me my analytics" },
  { icon: Inbox,    label: "Check inbox",    message: "Check my inbox"       },
  { icon: Plus,     label: "New campaign",   href: "/dashboard/campaigns/new" },
  { icon: Repeat,   label: "Follow-ups",     message: "Show my follow-ups"   },
];

export function QuickActions({ onSend }: QuickActionsProps) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {ACTIONS.map(({ icon: Icon, label, message, href }) => (
        <button
          key={label}
          onClick={() => {
            if (href) { router.push(href); return; }
            if (message) onSend(message);
          }}
          style={{
            padding: "6px 10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 6,
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 48,
            fontFamily: "var(--font-outfit)",
            transition: "background 150ms, color 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            e.currentTarget.style.color = "rgba(255,255,255,0.55)";
          }}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/agent/_components/QuickActions.tsx
git commit -m "feat: add QuickActions component"
```

---

### Task 14: RecentChats component

**Files:**
- Create: `app/dashboard/agent/_components/RecentChats.tsx`

- [ ] **Step 1: Create RecentChats**

```tsx
// app/dashboard/agent/_components/RecentChats.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadIndex } from "../_lib/storage";
import { ChatIndexEntry } from "../_lib/types";

interface RecentChatsProps {
  currentChatId: string;
}

export function RecentChats({ currentChatId }: RecentChatsProps) {
  const [chats, setChats] = useState<ChatIndexEntry[]>([]);

  useEffect(() => {
    setChats(loadIndex());
  }, [currentChatId]);

  return (
    <div>
      <Link
        href="/dashboard/agent"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 10px",
          background: "rgba(255,82,0,0.08)",
          border: "1px solid rgba(255,82,0,0.2)",
          borderRadius: 6,
          fontSize: 12,
          color: "#FF5200",
          textDecoration: "none",
          marginBottom: 6,
          minHeight: 36,
          fontFamily: "var(--font-outfit)",
          fontWeight: 500,
        }}
      >
        New chat
      </Link>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/dashboard/agent/${chat.id}`}
            style={{
              padding: "5px 8px",
              borderRadius: 5,
              fontSize: 13,
              color:
                chat.id === currentChatId
                  ? "rgba(255,255,255,0.75)"
                  : "rgba(255,255,255,0.35)",
              background:
                chat.id === currentChatId ? "rgba(255,82,0,0.08)" : "transparent",
              border:
                chat.id === currentChatId
                  ? "1px solid rgba(255,82,0,0.15)"
                  : "1px solid transparent",
              textDecoration: "none",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-outfit)",
              minHeight: 32,
            }}
          >
            {chat.title}
          </Link>
        ))}
        {chats.length === 0 && (
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.2)",
              padding: "4px 8px",
              fontFamily: "var(--font-outfit)",
            }}
          >
            No recent chats
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/agent/_components/RecentChats.tsx
git commit -m "feat: add RecentChats component"
```

---

### Task 15: Sidebar component

**Files:**
- Create: `app/dashboard/agent/_components/Sidebar.tsx`

- [ ] **Step 1: Create Sidebar**

```tsx
// app/dashboard/agent/_components/Sidebar.tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { ContextPanel } from "./ContextPanel";
import { QuickActions } from "./QuickActions";
import { RecentChats } from "./RecentChats";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  currentChatId: string;
}

function SidebarBody({
  onSend,
  currentChatId,
}: {
  onSend: (message: string) => void;
  currentChatId: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 8,
          }}
        >
          Active Campaign
        </p>
        <ContextPanel />
      </div>
      <div>
        <p
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 6,
          }}
        >
          Quick Actions
        </p>
        <QuickActions onSend={onSend} />
      </div>
      <div>
        <p
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 6,
          }}
        >
          Recent Chats
        </p>
        <RecentChats currentChatId={currentChatId} />
      </div>
    </div>
  );
}

export function Sidebar({
  isOpen,
  isMobile,
  onClose,
  onSend,
  currentChatId,
}: SidebarProps) {
  useEffect(() => {
    if (!isMobile) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMobile, isOpen, onClose]);

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                zIndex: 40,
              }}
            />
            <motion.div
              id="agent-sidebar"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                background: "#070710",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px 16px 0 0",
                zIndex: 50,
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "var(--font-outfit)",
                  }}
                >
                  Context Panel
                </span>
                <button
                  onClick={onClose}
                  aria-label="Close sidebar"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.5)",
                    minWidth: 48,
                    minHeight: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontFamily: "var(--font-outfit)",
                  }}
                >
                  Close
                </button>
              </div>
              <SidebarBody onSend={onSend} currentChatId={currentChatId} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          id="agent-sidebar"
          key="desktop-sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "45%", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            background: "#070710",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Context Panel
            </span>
          </div>
          <SidebarBody onSend={onSend} currentChatId={currentChatId} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/agent/_components/Sidebar.tsx
git commit -m "feat: add Sidebar component"
```

---

### Task 16: ChatInterface component

**Files:**
- Create: `app/dashboard/agent/_components/ChatInterface.tsx`

- [ ] **Step 1: Create ChatInterface**

```tsx
// app/dashboard/agent/_components/ChatInterface.tsx
"use client";
import { Message, useChat } from "ai/react";
import { motion, useReducedMotion } from "framer-motion";
import { PanelRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadChat, saveChat } from "../_lib/storage";
import { ChatMessage } from "../_lib/types";
import { AgentAvatar } from "./AgentAvatar";
import { InputArea } from "./InputArea";
import { MessageList } from "./MessageList";
import { Sidebar } from "./Sidebar";

interface ChatInterfaceProps {
  chatId: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hey, I'm your Nexora agent. Ask me about campaigns, leads, analytics, or tell me what you want to do.",
};

export function ChatInterface({ chatId }: ChatInterfaceProps) {
  const prefersReduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const freshIds = useRef<Set<string>>(new Set());
  const seenIds = useRef<Set<string>>(new Set(["welcome"]));

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    setSidebarOpen(!mq.matches);
    function handler(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
      if (e.matches) setSidebarOpen(false);
    }
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const stored = loadChat(chatId) as Message[];

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } =
    useChat({
      api: "/api/chat",
      id: chatId,
      initialMessages: stored.length > 0 ? stored : [WELCOME],
    });

  useEffect(() => {
    const toSave = messages.filter(
      (m) => m.id !== "welcome"
    ) as unknown as ChatMessage[];
    if (toSave.length > 0) {
      saveChat(chatId, toSave);
    }
  }, [chatId, messages]);

  useEffect(() => {
    for (const msg of messages) {
      if (!seenIds.current.has(msg.id)) {
        seenIds.current.add(msg.id);
        if (msg.role === "assistant") {
          freshIds.current.add(msg.id);
        }
      }
    }
  }, [messages]);

  function handleQuickAction(message: string) {
    append({ role: "user", content: message });
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#080810",
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={prefersReduced ? false : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          padding: "0 16px",
          height: 52,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <AgentAvatar isLoading={false} />
        <span
          style={{
            fontSize: 14,
            color: "#fff",
            fontFamily: "var(--font-space-grotesk)",
            fontWeight: 600,
          }}
        >
          Nexora Agent
        </span>
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          aria-expanded={sidebarOpen}
          aria-controls="agent-sidebar"
          aria-label="Toggle sidebar"
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.4)",
            padding: 4,
            minWidth: 48,
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
        >
          <motion.div
            animate={{ rotate: sidebarOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: "flex" }}
          >
            <PanelRight size={18} />
          </motion.div>
        </button>
      </motion.div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <motion.main
          role="main"
          initial={prefersReduced ? false : { y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <MessageList
            messages={messages}
            isLoading={isLoading}
            freshMessageIds={freshIds.current}
          />
          <InputArea
            input={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </motion.main>

        {!isMobile && (
          <motion.div
            initial={prefersReduced ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ display: "flex" }}
          >
            <Sidebar
              isOpen={sidebarOpen}
              isMobile={false}
              onClose={() => setSidebarOpen(false)}
              onSend={handleQuickAction}
              currentChatId={chatId}
            />
          </motion.div>
        )}
      </div>

      {isMobile && (
        <Sidebar
          isOpen={sidebarOpen}
          isMobile={true}
          onClose={() => setSidebarOpen(false)}
          onSend={handleQuickAction}
          currentChatId={chatId}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/agent/_components/ChatInterface.tsx
git commit -m "feat: add ChatInterface component"
```

---

### Task 17: Server Component pages

**Files:**
- Create: `app/dashboard/agent/page.tsx`
- Create: `app/dashboard/agent/[chatId]/page.tsx`

- [ ] **Step 1: Create the index page (UUID redirect)**

```tsx
// app/dashboard/agent/page.tsx
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

export default async function AgentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  redirect(`/dashboard/agent/${randomUUID()}`);
}
```

- [ ] **Step 2: Create the [chatId] page**

```tsx
// app/dashboard/agent/[chatId]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "../_components/ChatInterface";

interface Props {
  params: Promise<{ chatId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { chatId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <ChatInterface key={chatId} chatId={chatId} />;
}
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/agent/page.tsx "app/dashboard/agent/[chatId]/page.tsx"
git commit -m "feat: add agent chat Server Component pages"
```

---

### Task 18: Navbar update + end-to-end verification

**Files:**
- Modify: `app/dashboard/_components/navbar.tsx` line 22-27

- [ ] **Step 1: Add "Chat" to the NAV array**

In `app/dashboard/_components/navbar.tsx`, update the `NAV` constant:

```ts
// Before (line 22):
const NAV: NavItem[] = [
  { label: "Agent",       href: "/dashboard",                exact: true },
  { label: "Campaigns",   href: "/dashboard/campaigns"                   },
  { label: "Inbox",       href: "/dashboard/inbox"                       },
  { label: "Preferences", href: "/dashboard/preferences"                 },
];

// After:
const NAV: NavItem[] = [
  { label: "Agent",       href: "/dashboard",                exact: true },
  { label: "Chat",        href: "/dashboard/agent"                       },
  { label: "Campaigns",   href: "/dashboard/campaigns"                   },
  { label: "Inbox",       href: "/dashboard/inbox"                       },
  { label: "Preferences", href: "/dashboard/preferences"                 },
];
```

- [ ] **Step 2: Run all unit tests**

```bash
npm test --no-coverage
```

Expected: all tests pass (storage x6, useTypewriter x5, CopyButton x4)

- [ ] **Step 3: Start dev server and verify**

```bash
npm run dev
```

Verify each of the following in the browser at `http://localhost:3000`:

- [ ] Visiting `/dashboard/agent` redirects to `/dashboard/agent/<uuid>`
- [ ] The page renders a 2-column layout (chat 55%, sidebar 45%)
- [ ] Navbar shows a "Chat" link that is highlighted when on `/dashboard/agent/*`
- [ ] The "Agent" nav link is NOT highlighted when on the chat page (exact match only)
- [ ] Send a message - streaming response appears, AgentAvatar pulses during loading
- [ ] After response completes, typewriter animation plays on the last agent message
- [ ] CopyButton appears under agent messages; clicking it swaps to checkmark (green) for 2s
- [ ] Sidebar toggle button collapses/expands the sidebar with animation
- [ ] Quick Actions buttons send messages (no emojis in button labels)
- [ ] Refresh the page - same chat messages persist (localStorage)
- [ ] Click "New chat" in Recent Chats - navigates to `/dashboard/agent` which redirects to a new UUID
- [ ] Previous chat appears in Recent Chats list with its title
- [ ] On a mobile viewport (<768px): sidebar is hidden by default, toggle opens a bottom sheet

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/_components/navbar.tsx
git commit -m "feat: add Chat nav link, complete agent chat page"
```
