# Email Template Variation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a campaign-level template picker that generates 5 AI-written tone variants per signal type, lets the user choose one + a subject line before sending, and records which template was used for future reply-rate analytics.

**Architecture:** A new `email_templates` table holds AI-generated variants (scoped per campaign). The campaign wizard's existing "Send via Gmail" button gains a new `"template-picking"` phase that calls two new API routes (`/api/templates/generate` and `/api/templates/generate-subjects`) before the existing confirmation step. The send route reads `campaigns.selected_template_id` and `campaigns.selected_subject_line` and applies placeholder substitution per lead when a template is active; it falls back to the existing per-lead `generated_subject` / `generated_body` when no template is chosen.

**Tech Stack:** Next.js 16 App Router route handlers, Anthropic SDK (`claude-haiku-4-5-20251001`), Supabase service role client, inline React state machine in `send-button.tsx`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/add_email_templates.sql` | Create | `email_templates` table + two new columns on `campaigns` |
| `app/api/templates/generate/route.ts` | Create | Generate 5 tone variants via AI, save to `email_templates`, return with IDs |
| `app/api/templates/generate-subjects/route.ts` | Create | Generate 3 subject line variations for a chosen tone |
| `app/api/campaigns/[id]/template/route.ts` | Create | PATCH: write `selected_template_id` + `selected_subject_line` to the campaign row |
| `app/api/campaigns/send/route.ts` | Modify | Fetch selected template; substitute `{first_name}` / `{company_name}` per lead |
| `app/dashboard/campaigns/[id]/page.tsx` | Modify | Query most-common signal for the campaign; pass signal type + sample lead info to `SendCampaignButton` |
| `app/dashboard/campaigns/[id]/send-button.tsx` | Modify | New `"template-picking"` phase + `TemplatePicker` component |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/add_email_templates.sql`

- [ ] **Step 1: Write migration file**

```sql
-- email_templates: AI-generated tone variants per campaign.
-- Rows are deleted and re-created each time the user hits "generate templates".
-- reply_count / sample_size are incremented by future reply-detection logic.
CREATE TABLE IF NOT EXISTS public.email_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  signal_type   TEXT        NOT NULL DEFAULT 'general',
  tone          TEXT        NOT NULL,
  subject       TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  reply_count   INT         NOT NULL DEFAULT 0,
  sample_size   INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS et_campaign_id_idx ON email_templates (campaign_id);

-- selected_template_id is intentionally not an FK to avoid circular reference
-- (email_templates.campaign_id → campaigns.id and campaigns.selected_template_id → email_templates.id).
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS selected_template_id UUID,
  ADD COLUMN IF NOT EXISTS selected_subject_line TEXT;
```

- [ ] **Step 2: Apply in Supabase dashboard**

Open the Supabase dashboard → SQL Editor → paste the contents of the file → Run.

Verify by running:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'campaigns'
AND column_name IN ('selected_template_id', 'selected_subject_line');
```
Expected: 2 rows returned.

```sql
SELECT COUNT(*) FROM email_templates;
```
Expected: 0 (table exists, empty).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/add_email_templates.sql
git commit -m "feat: add email_templates table and selected template columns on campaigns"
```

---

## Task 2: POST /api/templates/generate

**Files:**
- Create: `app/api/templates/generate/route.ts`

This route generates 5 tone variants (formal, casual, urgent, value-first, social-proof) via the Anthropic haiku model, deletes any existing templates for the campaign, inserts fresh rows, and returns the saved rows with UUIDs.

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { campaign_id, signal_type, contact_name, company_name } = body as {
    campaign_id?: string;
    signal_type?: string;
    contact_name?: string;
    company_name?: string;
  };

  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id is required" }, { status: 400 });
  }

  const db = getDb();

  // Verify campaign belongs to this user
  const { data: campaign } = await db
    .from("campaigns")
    .select("id")
    .eq("id", campaign_id)
    .eq("user_id", user.id)
    .single();
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const signalContext = signal_type && signal_type !== "general"
    ? `The target company has a recent "${signal_type}" signal (e.g. a new job posting, funding round, GitHub activity, or product launch).`
    : "No specific signal — write based on general B2B outreach.";

  const sampleName = contact_name || "Alex";
  const sampleCompany = company_name || "their company";

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1400,
    messages: [{
      role: "user",
      content: `Write 5 cold email templates for B2B outreach. Return ONLY a JSON array with exactly 5 objects. No markdown, no code fences, no explanation.

Signal context: ${signalContext}
Sample target: ${sampleName} at ${sampleCompany}

Each object must be exactly: { "tone": string, "subject": string, "body": string }

Generate these 5 tones in this exact order:
1. "formal" - executive, polished, corporate language
2. "casual" - conversational, peer-to-peer, friendly tone
3. "urgent" - FOMO or time-pressure, but not pushy
4. "value-first" - lead with specific ROI or outcome before the ask
5. "social-proof" - reference similar companies or concrete results achieved

Rules for subject:
- 6-10 words, no spam trigger words (free, guaranteed, limited time, act now)
- Compelling and specific to the signal context

Rules for body:
- Exactly 2-3 sentences
- Use {first_name} and {company_name} as placeholders (curly-brace syntax — the system substitutes them per lead at send time)
- First sentence must naturally reference the signal context
- Last sentence must be a specific, clear CTA

Return ONLY the JSON array. Nothing else.`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

  let variants: { tone: string; subject: string; body: string }[];
  try {
    variants = JSON.parse(cleaned);
    if (!Array.isArray(variants) || variants.length === 0) throw new Error("empty");
  } catch {
    return NextResponse.json({ error: "AI returned invalid response. Please try again." }, { status: 500 });
  }

  // Replace any existing templates for this campaign (re-generate = fresh slate)
  await db.from("email_templates").delete().eq("campaign_id", campaign_id);

  const rows = variants.map((v) => ({
    campaign_id,
    signal_type: signal_type ?? "general",
    tone: v.tone,
    subject: v.subject,
    body: v.body,
  }));

  const { data: saved, error: saveError } = await db
    .from("email_templates")
    .insert(rows)
    .select("id, tone, subject, body");

  if (saveError || !saved) {
    return NextResponse.json({ error: "Failed to save templates" }, { status: 500 });
  }

  return NextResponse.json({ templates: saved });
}
```

- [ ] **Step 2: Verify the route compiles and responds**

Start the dev server (`npm run dev`) and in a new terminal run:

```bash
# Replace COOKIE_VALUE with a valid session cookie from the browser
curl -X POST http://localhost:3000/api/templates/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=COOKIE_VALUE" \
  -d '{"campaign_id":"<any-campaign-uuid>","signal_type":"hiring","contact_name":"Alex","company_name":"Acme Corp"}'
```

Expected response: `{ "templates": [ { "id": "...", "tone": "formal", "subject": "...", "body": "..." }, ... ] }` with 5 objects.

If auth fails in curl, test by visiting the campaign detail page in the browser and opening DevTools → Network to confirm the route exists (it will 401 without a valid session, which confirms routing works).

- [ ] **Step 3: Commit**

```bash
git add app/api/templates/generate/route.ts
git commit -m "feat: add POST /api/templates/generate — 5 tone variants via AI"
```

---

## Task 3: POST /api/templates/generate-subjects

**Files:**
- Create: `app/api/templates/generate-subjects/route.ts`

This route returns 3 subject line variations for a selected tone + email body. Results are ephemeral (not stored) — the user picks one which gets saved via the template selection PATCH route.

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { signal_type, tone, email_body, company_name } = body as {
    signal_type?: string;
    tone?: string;
    email_body?: string;
    company_name?: string;
  };

  if (!tone || !email_body) {
    return NextResponse.json({ error: "tone and email_body are required" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Generate 3 subject line variations for this cold email. Return ONLY a JSON array of exactly 3 strings. No markdown.

Signal type: ${signal_type ?? "general"}
Tone: ${tone}
Target company: ${company_name ?? "their company"}
Email body: ${email_body}

Rules:
- 5-10 words each
- No spam trigger words (free, guaranteed, limited time, act now)
- 3 different angles: curiosity-based, direct/value, specific/personalized
- Match the ${tone} tone exactly

Return ONLY the JSON array of 3 strings. Nothing else.`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

  let subjects: string[];
  try {
    subjects = JSON.parse(cleaned);
    if (!Array.isArray(subjects)) throw new Error("not array");
    subjects = subjects.slice(0, 3).map(String);
  } catch {
    return NextResponse.json({ error: "AI returned invalid response. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ subjects });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/templates/generate-subjects/route.ts
git commit -m "feat: add POST /api/templates/generate-subjects — 3 subject variations"
```

---

## Task 4: PATCH /api/campaigns/[id]/template

**Files:**
- Create: `app/api/campaigns/[id]/template/route.ts`

This route records the user's template + subject line choice on the campaign row.

- [ ] **Step 1: Create the route file**

```typescript
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { selected_template_id, selected_subject_line } = body as {
    selected_template_id?: string;
    selected_subject_line?: string;
  };

  if (!selected_template_id || !selected_subject_line) {
    return NextResponse.json(
      { error: "selected_template_id and selected_subject_line are required" },
      { status: 400 }
    );
  }

  const db = getDb();
  const { error } = await db
    .from("campaigns")
    .update({ selected_template_id, selected_subject_line })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/campaigns/[id]/template/route.ts
git commit -m "feat: add PATCH /api/campaigns/[id]/template — save template selection"
```

---

## Task 5: Modify Send Route to Apply Selected Template

**Files:**
- Modify: `app/api/campaigns/send/route.ts`

When a campaign has `selected_template_id` set, the send loop must:
1. Use the template body (fetched from `email_templates`) with `{first_name}` / `{company_name}` substituted per lead
2. Use `selected_subject_line` from the campaign row as the subject

When no template is selected, fall back to per-lead `generated_subject` / `generated_body` exactly as today.

- [ ] **Step 1: Extend the campaign fetch and add template lookup**

Read the file first (`app/api/campaigns/send/route.ts`), then make the following targeted changes:

**Change 1** — extend the lead select to include `first_name` and `company` (needed for placeholder substitution):

Old (line ~221):
```typescript
        const { data: leads, error: leadsError } = await db
          .from("leads")
          .select("id, email, generated_subject, generated_body")
          .eq("campaign_id", campaignId)
          .eq("unsubscribed", false)
          .order("created_at");
```

New:
```typescript
        const { data: leads, error: leadsError } = await db
          .from("leads")
          .select("id, email, first_name, company, generated_subject, generated_body")
          .eq("campaign_id", campaignId)
          .eq("unsubscribed", false)
          .order("created_at");
```

**Change 2** — after the `leadsError` guard and before the `toSend` slice, fetch the campaign's selected template if one exists. Insert this block right after `if (leadsError || !leads || leads.length === 0) { ... }`:

```typescript
        // Fetch campaign to check for a selected template
        const { data: campaignRow } = await db
          .from("campaigns")
          .select("selected_template_id, selected_subject_line")
          .eq("id", campaignId)
          .single();

        let templateBody: string | null = null;
        const templateSubject: string | null = campaignRow?.selected_subject_line ?? null;

        if (campaignRow?.selected_template_id) {
          const { data: tmpl } = await db
            .from("email_templates")
            .select("body")
            .eq("id", campaignRow.selected_template_id)
            .single();
          templateBody = tmpl?.body ?? null;
        }
```

**Change 3** — in the send loop, use the template when active. The loop is at line ~244. Replace the subject/body resolution inside the loop:

Old (inside the loop, around where `buildRawMessage` is called):
```typescript
          const raw = buildRawMessage({
            to: lead.email,
            from: fromEmail,
            subject: lead.generated_subject ?? "(no subject)",
            body: lead.generated_body ?? "",
            leadId: lead.id,
            unsubscribeUrl,
            companyName,
            physicalAddress,
          });
```

New:
```typescript
          const leadFirstName: string = (lead as { first_name?: string }).first_name ?? "";
          const leadCompany: string = (lead as { company?: string }).company ?? "";

          const subject = templateSubject
            ?? lead.generated_subject
            ?? "(no subject)";

          const body = templateBody
            ? templateBody
                .replace(/\{first_name\}/gi, leadFirstName)
                .replace(/\{company_name\}/gi, leadCompany)
            : (lead.generated_body ?? "");

          const raw = buildRawMessage({
            to: lead.email,
            from: fromEmail,
            subject,
            body,
            leadId: lead.id,
            unsubscribeUrl,
            companyName,
            physicalAddress,
          });
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If there are type errors about `first_name` or `company` not existing on the lead type, the cast `(lead as { first_name?: string })` handles it since the select is dynamic.

- [ ] **Step 3: Commit**

```bash
git add app/api/campaigns/send/route.ts
git commit -m "feat: apply selected campaign template with placeholder substitution in send route"
```

---

## Task 6: Template Picker Modal — Campaign Page + Send Button

**Files:**
- Modify: `app/dashboard/campaigns/[id]/page.tsx`
- Modify: `app/dashboard/campaigns/[id]/send-button.tsx`

### Part A: Campaign Page — pass signal type and sample lead info

The campaign page needs to determine the primary signal type (most common signal source across the campaign's leads) and the first lead's name/company (used as sample input to the generate API).

- [ ] **Step 1: Add signals query to the page**

Read `app/dashboard/campaigns/[id]/page.tsx`. The file has a `Promise.all` at line ~34. Add a fifth query inside the same `Promise.all`:

Old:
```typescript
  const [{ data: campaign }, { data: leads }, { data: sub }, { data: gmailConn }] = await Promise.all([
    supabase
      .from("campaigns")
      ...
      .single(),
    supabase
      .from("leads")
      ...
      .order("created_at"),
    supabase
      .from("subscriptions")
      ...
      .single(),
    supabase
      .from("gmail_connections")
      ...
      .maybeSingle(),
  ]);
```

New:
```typescript
  const [{ data: campaign }, { data: leads }, { data: sub }, { data: gmailConn }, { data: signals }] = await Promise.all([
    supabase
      .from("campaigns")
      ...
      .single(),
    supabase
      .from("leads")
      ...
      .order("created_at"),
    supabase
      .from("subscriptions")
      ...
      .single(),
    supabase
      .from("gmail_connections")
      ...
      .maybeSingle(),
    supabase
      .from("signals")
      .select("source")
      .eq("campaign_id", id)
      .limit(100),
  ]);
```

- [ ] **Step 2: Compute primarySignalType and sample lead info, then pass to SendCampaignButton**

After the `const allLeads = leads ?? [];` line, add:

```typescript
  // Find the most common signal source for this campaign
  const sourceCounts: Record<string, number> = {};
  for (const sig of signals ?? []) {
    sourceCounts[sig.source] = (sourceCounts[sig.source] ?? 0) + 1;
  }
  const primarySignalType: string | null = Object.keys(sourceCounts).length > 0
    ? Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  const firstLead = allLeads[0];
  const sampleContactName: string = firstLead?.first_name ?? "";
  const sampleCompanyName: string = firstLead?.company ?? "";
```

Then find the `<SendCampaignButton ...>` JSX in the page and add the three new props:

```tsx
<SendCampaignButton
  campaignId={campaign.id}
  campaignName={campaign.name}
  totalLeads={allLeads.length}
  plan={plan}
  gmailEmail={gmailEmail}
  initialStatus={campaign.status}
  followUpDelays={campaign.follow_up_delays ?? [3, 5, 7]}
  followUpsEnabled={campaign.follow_ups_enabled ?? true}
  primarySignalType={primarySignalType}
  sampleContactName={sampleContactName}
  sampleCompanyName={sampleCompanyName}
/>
```

The `leads` select already includes `first_name` and `company` (line 43-44 of the original page), so no changes needed there.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: TypeScript will error because `SendCampaignButton` doesn't accept the new props yet. That's expected — you'll fix it in Part B. Check that the page file itself has no unrelated errors first.

### Part B: Add TemplatePicker to send-button.tsx

- [ ] **Step 4: Add new props, new phase, and TemplatePicker to send-button.tsx**

Read the full `app/dashboard/campaigns/[id]/send-button.tsx` file. Make the following changes:

**Change 1** — extend the `Props` type (at the top of the file):

Old:
```typescript
type Props = {
  campaignId: string;
  campaignName: string;
  totalLeads: number;
  plan: string;
  gmailEmail: string | null;
  initialStatus: string;
  followUpDelays?: [number, number, number];
  followUpsEnabled?: boolean;
};
```

New:
```typescript
type Props = {
  campaignId: string;
  campaignName: string;
  totalLeads: number;
  plan: string;
  gmailEmail: string | null;
  initialStatus: string;
  followUpDelays?: [number, number, number];
  followUpsEnabled?: boolean;
  primarySignalType?: string | null;
  sampleContactName?: string;
  sampleCompanyName?: string;
};
```

**Change 2** — add `"template-picking"` to `SendState` (after the existing union type definition):

Old:
```typescript
type SendState =
  | { phase: "idle" }
  | { phase: "confirming" }
  | { phase: "sending"; sent: number; total: number; currentTo: string }
  ...
```

New:
```typescript
type SendState =
  | { phase: "idle" }
  | { phase: "template-picking" }
  | { phase: "confirming" }
  | { phase: "sending"; sent: number; total: number; currentTo: string }
  ...
```

**Change 3** — update the function signature to accept the new props:

Old:
```typescript
export default function SendCampaignButton({
  campaignId,
  campaignName,
  totalLeads,
  plan,
  gmailEmail,
  initialStatus,
  followUpDelays = [3, 5, 7],
  followUpsEnabled = true,
}: Props) {
```

New:
```typescript
export default function SendCampaignButton({
  campaignId,
  campaignName,
  totalLeads,
  plan,
  gmailEmail,
  initialStatus,
  followUpDelays = [3, 5, 7],
  followUpsEnabled = true,
  primarySignalType = null,
  sampleContactName = "",
  sampleCompanyName = "",
}: Props) {
```

**Change 4** — in the idle render block, change the "Send via Gmail" button's `onClick` to go to `"template-picking"` instead of `"confirming"`:

Old:
```typescript
      <button
        onClick={() => setState({ phase: "confirming" })}
        ...
      >
```

New:
```typescript
      <button
        onClick={() => setState({ phase: "template-picking" })}
        ...
      >
```

**Change 5** — add the `"template-picking"` phase render block. Insert it before the `// ── Idle: show button + confirmation modal` comment:

```typescript
  // ── Template picking ──────────────────────────────────────────────────────
  if (state.phase === "template-picking") {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <TemplatePicker
          campaignId={campaignId}
          signalType={primarySignalType}
          contactName={sampleContactName}
          companyName={sampleCompanyName}
          onSelect={() => setState({ phase: "confirming" })}
          onSkip={() => setState({ phase: "confirming" })}
        />
      </div>
    );
  }
```

**Change 6** — add the `TemplatePicker` component at the bottom of the file (after the `FollowupSetupModal` component):

```typescript
// ─── Template Picker ──────────────────────────────────────────────────────────

type TemplateVariant = { id: string; tone: string; subject: string; body: string };

const TONE_LABELS: Record<string, string> = {
  formal: "Formal",
  casual: "Casual",
  urgent: "Urgent",
  "value-first": "Value-First",
  "social-proof": "Social Proof",
};

function TemplatePicker({
  campaignId,
  signalType,
  contactName,
  companyName,
  onSelect,
  onSkip,
}: {
  campaignId: string;
  signalType: string | null;
  contactName: string;
  companyName: string;
  onSelect: () => void;
  onSkip: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateVariant[]>([]);
  const [activeTone, setActiveTone] = useState<string>("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const activeTemplate = templates.find((t) => t.tone === activeTone) ?? null;

  // Generate templates on mount
  useEffect(() => {
    async function generate() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/templates/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaign_id: campaignId,
            signal_type: signalType ?? "general",
            contact_name: contactName,
            company_name: companyName,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Generation failed");
        const tmpl: TemplateVariant[] = data.templates ?? [];
        setTemplates(tmpl);
        if (tmpl.length > 0) {
          setActiveTone(tmpl[0].tone);
          setSelectedSubject(tmpl[0].subject);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to generate templates");
      } finally {
        setLoading(false);
      }
    }
    void generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When tone changes, reset subject to the template's own subject
  useEffect(() => {
    if (activeTemplate) setSelectedSubject(activeTemplate.subject);
    setSubjects([]);
  }, [activeTone, activeTemplate]);

  async function loadSubjects() {
    if (!activeTemplate) return;
    setSubjectsLoading(true);
    try {
      const res = await fetch("/api/templates/generate-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signal_type: signalType ?? "general",
          tone: activeTone,
          email_body: activeTemplate.body,
          company_name: companyName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSubjects(data.subjects ?? []);
    } catch {
      // silently fail — user still has the default subject
    } finally {
      setSubjectsLoading(false);
    }
  }

  async function handleUse() {
    if (!activeTemplate) return;
    setSaving(true);
    try {
      await fetch(`/api/campaigns/${campaignId}/template`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_template_id: activeTemplate.id,
          selected_subject_line: selectedSubject || activeTemplate.subject,
        }),
      });
    } finally {
      setSaving(false);
    }
    onSelect();
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: "48px 32px",
        maxWidth: 560, width: "100%", textAlign: "center",
      }}>
        <Loader2
          size={32}
          strokeWidth={1.8}
          style={{ animation: "spin 1s linear infinite", color: "#FF5200", marginBottom: 16 }}
          aria-hidden="true"
        />
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)" }}>
          Writing 5 template variants…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        backgroundColor: "#0e0e0e", border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 16, padding: "36px 28px",
        maxWidth: 420, width: "100%", textAlign: "center",
      }}>
        <p style={{ fontSize: 14, color: "#ef4444", fontFamily: "var(--font-outfit)", marginBottom: 20 }}>
          {error}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onSkip}
            style={{
              padding: "10px 20px", borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: 13, fontFamily: "var(--font-outfit)", cursor: "pointer",
            }}
          >
            Skip Templates
          </button>
        </div>
      </div>
    );
  }

  // ── Picker ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      backgroundColor: "#0e0e0e", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16, padding: "28px 28px 24px",
      maxWidth: 600, width: "100%",
      boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      maxHeight: "90vh", overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{
          fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "#FF5200", fontFamily: "var(--font-outfit)", marginBottom: 6,
        }}>
          Template Picker
        </p>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "var(--font-syne)", marginBottom: 4 }}>
          Choose a tone for this campaign
        </h2>
        <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-outfit)" }}>
          {signalType ? `Signal: ${signalType}` : "General outreach"} — placeholders like {"{first_name}"} are filled per lead at send time
        </p>
      </div>

      {/* Tone tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {templates.map((t) => (
          <button
            key={t.tone}
            onClick={() => setActiveTone(t.tone)}
            style={{
              padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              fontFamily: "var(--font-outfit)", cursor: "pointer",
              backgroundColor: activeTone === t.tone ? "#FF5200" : "rgba(255,255,255,0.05)",
              color: activeTone === t.tone ? "#fff" : "rgba(255,255,255,0.5)",
              border: activeTone === t.tone ? "1px solid #FF5200" : "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.15s",
            }}
          >
            {TONE_LABELS[t.tone] ?? t.tone}
          </button>
        ))}
      </div>

      {/* Active template preview */}
      {activeTemplate && (
        <div style={{
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10, padding: "14px 16px", marginBottom: 18,
        }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Subject (selected)
          </p>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#fff", fontFamily: "var(--font-outfit)", marginBottom: 14 }}>
            {selectedSubject || activeTemplate.subject}
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Body
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-outfit)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
            {activeTemplate.body}
          </p>
        </div>
      )}

      {/* Subject variations */}
      <div style={{ marginBottom: 22 }}>
        {subjects.length === 0 ? (
          <button
            onClick={loadSubjects}
            disabled={subjectsLoading}
            style={{
              padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              fontFamily: "var(--font-outfit)", cursor: subjectsLoading ? "default" : "pointer",
              backgroundColor: "rgba(255,255,255,0.04)",
              color: subjectsLoading ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            {subjectsLoading ? "Generating subjects…" : "+ Get 3 subject variations"}
          </button>
        ) : (
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-outfit)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Subject variations
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {subjects.map((s) => (
                <label
                  key={s}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                    backgroundColor: selectedSubject === s ? "rgba(255,82,0,0.06)" : "rgba(255,255,255,0.02)",
                    border: selectedSubject === s ? "1px solid rgba(255,82,0,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <input
                    type="radio"
                    name="subject"
                    value={s}
                    checked={selectedSubject === s}
                    onChange={() => setSelectedSubject(s)}
                    style={{ accentColor: "#FF5200", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-outfit)" }}>
                    {s}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={handleUse}
          disabled={saving || !activeTemplate}
          style={{
            flex: 1, padding: "11px 0", borderRadius: 9,
            backgroundColor: saving ? "rgba(255,82,0,0.5)" : "#FF5200",
            color: "#fff", border: "none",
            fontSize: 14, fontWeight: 700, fontFamily: "var(--font-outfit)",
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Use This Template"}
        </button>
        <button
          onClick={onSkip}
          style={{
            padding: "11px 16px", borderRadius: 9,
            backgroundColor: "transparent", color: "rgba(255,255,255,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 13, fontFamily: "var(--font-outfit)", cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
```

Note: `TemplatePicker` uses `useState` and `useEffect` from React. The existing `send-button.tsx` already imports `useState` at the top. Add `useEffect` to the same import:

Old:
```typescript
import { useState } from "react";
```

New:
```typescript
import { useState, useEffect } from "react";
```

- [ ] **Step 5: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Manually test the full flow in the browser**

1. Open any campaign detail page that has a Gmail connection and Pro plan
2. Click "Send via Gmail"
3. Expected: Template Picker modal appears with a spinner ("Writing 5 template variants…")
4. After 3-5 seconds: 5 tone tabs appear with subject + body preview for "Formal" selected
5. Click each tone tab — subject and body update, subject-variations section resets
6. Click "+ Get 3 subject variations" — 3 radio buttons appear
7. Select a different subject line
8. Click "Use This Template"
9. Expected: modal closes, the standard confirmation modal appears ("Send X emails?")
10. Click "Send Now"
11. Verify: Supabase dashboard → `campaigns` table → row has `selected_template_id` and `selected_subject_line` populated
12. Verify: `email_templates` table → 5 rows for this campaign with the 5 tones

Also test the "Skip" path:
1. Click "Send via Gmail" → Template picker appears
2. Click "Skip"
3. Expected: confirmation modal appears, send proceeds using per-lead `generated_subject` / `generated_body`

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/campaigns/[id]/page.tsx app/dashboard/campaigns/[id]/send-button.tsx
git commit -m "feat: add template picker modal with 5 tone variants before send"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Covered By |
|---|---|
| 3-5 email templates per signal, tone variations | Task 2 (generates 5 tones: formal, casual, urgent, value-first, social-proof) |
| POST /api/templates/generate — signal_type, company_name, contact_name | Task 2 |
| POST /api/templates/generate-subjects — 3 subject variations | Task 3 |
| Template picker modal in campaign flow | Task 6, send-button.tsx `"template-picking"` phase |
| Analytics tracking reply_rate per template_id | `reply_count` + `sample_size` columns on `email_templates` (Task 1); reply increment not wired — needs future reply-detection hook |
| DB: email_templates table | Task 1 |
| DB: campaigns.selected_template_id + selected_subject_line | Task 1 |
| Template applied at send time | Task 5 (placeholder substitution in send route) |

**Reply-rate tracking note:** The `reply_count` and `sample_size` columns are present on `email_templates`. Incrementing them when a reply is detected is out of scope for this plan — it requires hooking into the email reply-detection mechanism (not yet implemented).

**Placeholder scan:** No TBD, TODO, or "similar to task N" patterns.

**Type consistency:** `TemplateVariant` (`id, tone, subject, body`) defined once in send-button.tsx and used consistently. `selected_template_id` is a plain `UUID` string across all files.
