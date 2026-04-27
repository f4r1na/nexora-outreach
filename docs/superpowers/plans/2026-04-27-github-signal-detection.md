# GitHub Signal Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect major tech-stack upgrades in a lead's public GitHub repo (via package.json) and store them as high-confidence signals in the signals table.

**Architecture:** A manual POST endpoint parses a GitHub repo URL, fetches package.json via the raw GitHub CDN (no auth needed for public repos), compares against a cached version in `github_repos`, creates signal rows for detected major-version bumps, and the lead panel gains a "Check GitHub" button + URL input that appends the returned signals live.

**Tech Stack:** Next.js App Router route handler, Supabase service client, GitHub raw content CDN, existing `signals` table + new `github_repos` cache table.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/add_github_repos.sql` | `github_repos` cache table + `type`/`text` columns on `signals` |
| Create | `app/api/signals/github/detect/route.ts` | Parse URL, fetch package.json, diff versions, insert signal rows |
| Modify | `app/dashboard/campaigns/[id]/_components/lead-panel.tsx` | "Check GitHub" button + URL input + live signal append |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/add_github_repos.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Cache GitHub package.json per repo to enable upgrade detection across checks.
CREATE TABLE IF NOT EXISTS public.github_repos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_url          TEXT NOT NULL UNIQUE,
  owner             TEXT NOT NULL,
  repo              TEXT NOT NULL,
  last_package_json JSONB,
  last_checked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure type and text exist on signals (may already be present in remote DB).
ALTER TABLE signals ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS text TEXT;
```

- [ ] **Step 2: Apply the migration in Supabase dashboard**

Open Supabase dashboard → SQL Editor → paste the migration → Run.
Verify: `github_repos` table exists; `signals` has `type` and `text` columns.

- [ ] **Step 3: Commit migration**

```bash
git add supabase/migrations/add_github_repos.sql
git commit -m "feat: add github_repos cache table and signals type/text columns"
```

---

## Task 2: GitHub Detect API Route

**Files:**
- Create: `app/api/signals/github/detect/route.ts`

- [ ] **Step 1: Create the route file**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const gh = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s?#]+)/);
  if (gh) return { owner: gh[1], repo: gh[2] };
  const plain = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (plain) return { owner: plain[1], repo: plain[2] };
  return null;
}

function getMajorVersion(version: string): number | null {
  const clean = version.replace(/^[\^~>=<*\s]+/, "").trim();
  const match = clean.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

type DepsMap = Record<string, string>;

function extractDeps(pkg: Record<string, unknown>): DepsMap {
  return {
    ...(pkg.dependencies as DepsMap ?? {}),
    ...(pkg.devDependencies as DepsMap ?? {}),
  };
}

type Change = { package: string; from: number; to: number };

function detectMajorUpgrades(oldDeps: DepsMap, newDeps: DepsMap): Change[] {
  const changes: Change[] = [];
  for (const [pkg, newVer] of Object.entries(newDeps)) {
    const newMajor = getMajorVersion(newVer);
    if (newMajor === null) continue;
    const oldVer = oldDeps[pkg];
    if (!oldVer) continue;
    const oldMajor = getMajorVersion(oldVer);
    if (oldMajor === null || newMajor <= oldMajor) continue;
    changes.push({ package: pkg, from: oldMajor, to: newMajor });
  }
  return changes;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { lead_id, repo_url } = body as { lead_id?: string; repo_url?: string };

    if (!lead_id || !repo_url) {
      return NextResponse.json({ error: "lead_id and repo_url required" }, { status: 400 });
    }

    const db = getDb();

    // Ownership check: lead must belong to user's campaign
    const { data: lead } = await db
      .from("leads")
      .select("id, campaign_id")
      .eq("id", lead_id)
      .single();
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const { data: camp } = await db
      .from("campaigns")
      .select("id")
      .eq("id", lead.campaign_id)
      .eq("user_id", user.id)
      .single();
    if (!camp) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const parsed = parseRepoUrl(repo_url);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid GitHub repo URL" }, { status: 400 });
    }
    const { owner, repo } = parsed;
    const normalizedUrl = `https://github.com/${owner}/${repo}`;

    // Fetch current package.json from GitHub CDN (no auth, public repos only)
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/package.json`;
    const ghRes = await fetch(rawUrl);
    if (!ghRes.ok) {
      return NextResponse.json(
        { error: `Cannot fetch package.json from ${normalizedUrl}. Is this a public repo with a package.json at the root?` },
        { status: 422 }
      );
    }

    let currentPkg: Record<string, unknown>;
    try {
      currentPkg = await ghRes.json();
    } catch {
      return NextResponse.json({ error: "package.json is not valid JSON" }, { status: 422 });
    }

    // Load cached version
    const { data: cached } = await db
      .from("github_repos")
      .select("last_package_json")
      .eq("repo_url", normalizedUrl)
      .maybeSingle();

    const today = new Date().toISOString().slice(0, 10);
    const packageUrl = `https://github.com/${owner}/${repo}/blob/HEAD/package.json`;

    type NewSignal = {
      id: string;
      text: string;
      source: string;
      source_url: string | null;
      date: string;
      date_iso: string;
      strength: string;
      type: string;
    };
    const newSignals: NewSignal[] = [];

    if (cached?.last_package_json) {
      const oldDeps = extractDeps(cached.last_package_json as Record<string, unknown>);
      const newDeps = extractDeps(currentPkg);
      const changes = detectMajorUpgrades(oldDeps, newDeps);

      for (const change of changes) {
        const text = `Team upgraded ${change.package} from v${change.from} to v${change.to}`;

        // Check for existing signal to avoid duplicates (manual trigger may be called twice)
        const { data: existing } = await db
          .from("signals")
          .select("id")
          .eq("lead_id", lead_id)
          .eq("source", "GitHub")
          .eq("text", text)
          .maybeSingle();

        if (!existing) {
          const { data: inserted } = await db
            .from("signals")
            .insert({
              lead_id,
              campaign_id: lead.campaign_id,
              source: "GitHub",
              source_url: packageUrl,
              date: today,
              date_iso: today,
              strength: "high",
              type: "tech_upgrade",
              text,
              discarded: false,
            })
            .select("id, text, source, source_url, date, date_iso, strength, type")
            .single();

          if (inserted) newSignals.push(inserted as NewSignal);
        }
      }
    }

    // Upsert cache with current package.json
    await db
      .from("github_repos")
      .upsert(
        {
          repo_url: normalizedUrl,
          owner,
          repo,
          last_package_json: currentPkg,
          last_checked_at: new Date().toISOString(),
        },
        { onConflict: "repo_url" }
      );

    const firstCheck = !cached;
    const message = firstCheck
      ? "Repository cached. Check again after the team pushes updates to detect upgrades."
      : newSignals.length > 0
        ? `Found ${newSignals.length} major upgrade${newSignals.length > 1 ? "s" : ""}`
        : "No major version changes since last check";

    return NextResponse.json({ signals: newSignals, message, first_check: firstCheck });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify the route builds cleanly**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓)" | head -30
```

Expected: no TypeScript errors in `app/api/signals/github/detect/route.ts`.

- [ ] **Step 3: Manual smoke test**

With the dev server running (`npm run dev`):

```bash
# Replace LEAD_ID with a real lead ID from your DB, and set a valid session cookie
curl -s -X POST http://localhost:3000/api/signals/github/detect \
  -H "Content-Type: application/json" \
  -b "..." \
  -d '{"lead_id":"<LEAD_ID>","repo_url":"https://github.com/facebook/react"}'
```

Expected first call: `{ "signals": [], "message": "Repository cached...", "first_check": true }`
Expected second call (no changes): `{ "signals": [], "message": "No major version changes...", "first_check": false }`

- [ ] **Step 4: Commit**

```bash
git add app/api/signals/github/detect/route.ts
git commit -m "feat: add POST /api/signals/github/detect for package.json upgrade detection"
```

---

## Task 3: Lead Panel UI - "Check GitHub" Button

**Files:**
- Modify: `app/dashboard/campaigns/[id]/_components/lead-panel.tsx`

The GitHub check UI lives inside the existing "Why we picked them" signals section, directly below the signals list (or below the "Refresh intel" button area). It consists of: a small "Check GitHub" toggle button, an inline URL input that appears when toggled, and a submit action.

- [ ] **Step 1: Add state variables**

In the `LeadPanel` component, after the existing state declarations (around line 147), add:

```ts
const [githubUrl, setGithubUrl] = useState("");
const [githubLoading, setGithubLoading] = useState(false);
const [showGithubInput, setShowGithubInput] = useState(false);
```

- [ ] **Step 2: Add the GitHub check handler**

After the `handleRefreshIntel` function (around line 250), add:

```ts
const handleGithubCheck = async () => {
  if (!lead || !githubUrl.trim() || githubLoading) return;
  setGithubLoading(true);
  try {
    const res = await fetch("/api/signals/github/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: lead.id, repo_url: githubUrl.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "GitHub check failed");
      return;
    }
    if (data.signals?.length > 0) {
      setSignals((prev) => [...(data.signals as Signal[]), ...prev]);
      toast.success(data.message);
    } else {
      toast(data.message, { style: { color: "#888" } });
    }
    setShowGithubInput(false);
    setGithubUrl("");
  } catch {
    toast.error("GitHub check failed");
  } finally {
    setGithubLoading(false);
  }
};
```

- [ ] **Step 3: Add the GitHub UI inside the signals section**

In the signals section (`"Why we picked them"` div), after the closing `</div>` of the `isPending ? ... : visibleSignals.length > 0 ? ... : ...` block (around line 800), add the GitHub check block before the closing `</div>` of the signals card:

```tsx
{/* GitHub signal check */}
<div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 10 }}>
  {showGithubInput ? (
    <div style={{ display: "flex", gap: 6 }}>
      <input
        value={githubUrl}
        onChange={(e) => setGithubUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleGithubCheck(); if (e.key === "Escape") setShowGithubInput(false); }}
        placeholder="github.com/owner/repo"
        className="nx-input"
        style={{ flex: 1, fontSize: 11, padding: "5px 9px" }}
        autoFocus
      />
      <button
        onClick={handleGithubCheck}
        disabled={githubLoading || !githubUrl.trim()}
        style={{
          fontSize: 11,
          color: "#fff",
          backgroundColor: githubLoading || !githubUrl.trim() ? "rgba(255,82,0,0.3)" : "#FF5200",
          border: "none",
          borderRadius: 6,
          padding: "5px 11px",
          cursor: githubLoading || !githubUrl.trim() ? "not-allowed" : "pointer",
          fontFamily: "var(--font-outfit)",
          whiteSpace: "nowrap",
        }}
      >
        {githubLoading ? "Checking..." : "Check"}
      </button>
      <button
        onClick={() => { setShowGithubInput(false); setGithubUrl(""); }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.07)",
          backgroundColor: "transparent", color: "#444", cursor: "pointer",
        }}
      >
        <X size={10} />
      </button>
    </div>
  ) : (
    <button
      onClick={() => setShowGithubInput(true)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        color: "#555",
        backgroundColor: "transparent",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 5,
        padding: "3px 8px",
        cursor: "pointer",
        fontFamily: "var(--font-outfit)",
      }}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>
      Check GitHub
    </button>
  )}
</div>
```

- [ ] **Step 4: Reset GitHub state on lead change**

In the existing `useEffect` that resets signal state (around line 180), add resets for the new state:

Find this block:
```ts
  useEffect(() => {
    if (!lead?.id || lead.signal_status !== "done") {
      setSignals([]);
      setSigLoading(false);
      setDiscardedIds(new Set());
      return;
    }
```

Add the new resets after `setDiscardedIds(new Set());`:
```ts
      setShowGithubInput(false);
      setGithubUrl("");
```

- [ ] **Step 5: Build check**

```bash
npm run build 2>&1 | grep -E "(error|Error)" | head -20
```

Expected: no errors in `lead-panel.tsx`.

- [ ] **Step 6: Manual UI test**

1. Start dev server: `npm run dev`
2. Open any campaign with leads
3. Click a lead to open the panel
4. Scroll to "Why we picked them" section
5. Click "Check GitHub" button - text input should appear
6. Enter a real public GitHub repo (e.g. `facebook/react`) - click "Check" or press Enter
7. First call: toast shows "Repository cached. Check again after..."
8. Second call (same repo): toast shows "No major version changes since last check"
9. Verify pressing Escape closes the input
10. Verify the input resets when switching to a different lead

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/campaigns/[id]/_components/lead-panel.tsx
git commit -m "feat: add Check GitHub button to lead panel for package.json signal detection"
```

---

## Spec Coverage Check

| Requirement | Task |
|-------------|------|
| User pastes GitHub repo URL | Task 3 - URL input in lead panel |
| Check package.json for library versions | Task 2 - fetch raw.githubusercontent.com |
| Detect major upgrades (React 17->18) | Task 2 - `detectMajorUpgrades()` comparing semver major |
| Create signal: "Team upgraded to React 18" | Task 2 - inserts signal with text field |
| Store signal with source_url to commit | Task 2 - source_url = blob/HEAD/package.json URL |
| POST /api/signals/github/detect | Task 2 |
| Fetch via GitHub API, no auth, public repos | Task 2 - raw.githubusercontent.com CDN |
| Compare to cached version (github_repos table) | Task 1 + Task 2 |
| Detect major version changes | Task 2 - getMajorVersion() + detectMajorUpgrades() |
| Create signal: source=GitHub, strength=high, source_url | Task 2 |
| UI: Button in lead panel "Check GitHub signals" | Task 3 |
| Public repos only | Task 2 - no auth token used |
| Manual trigger, single repo at a time | Task 3 - button per-lead, not automated |
