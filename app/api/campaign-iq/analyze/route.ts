import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count: replyCount } = await supabase
    .from("email_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "replied");

  const currentReplyCount = replyCount ?? 0;

  const { data: existing } = await supabase
    .from("campaign_iq_insights")
    .select("*")
    .eq("user_id", user.id)
    .is("campaign_id", null)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && (existing as Record<string, unknown>).reply_count_at_analysis === currentReplyCount) {
    return NextResponse.json({ insight: existing, cached: true });
  }

  const { count: sentCount } = await supabase
    .from("email_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "sent");

  if ((sentCount ?? 0) < 1) {
    return NextResponse.json({ error: "Not enough data", minimum: 1, sent: sentCount ?? 0 });
  }

  const [{ data: sentEvents }, { data: repliedEvents }] = await Promise.all([
    supabase
      .from("email_events")
      .select("lead_id")
      .eq("user_id", user.id)
      .eq("event_type", "sent")
      .not("lead_id", "is", null)
      .limit(100),
    supabase
      .from("email_events")
      .select("lead_id")
      .eq("user_id", user.id)
      .eq("event_type", "replied")
      .not("lead_id", "is", null),
  ]);

  const sentLeadIds = [...new Set((sentEvents ?? []).map(e => e.lead_id as string))];
  const repliedLeadIdSet = new Set((repliedEvents ?? []).map(e => e.lead_id as string));

  if (sentLeadIds.length === 0) {
    return NextResponse.json({ error: "Not enough data", minimum: 10, sent: 0 });
  }

  const { data: leadsData } = await supabase
    .from("leads")
    .select("id, generated_subject, generated_body, signal_data")
    .in("id", sentLeadIds.slice(0, 60));

  const repliedLeads = (leadsData ?? []).filter(l => repliedLeadIdSet.has(l.id));
  const ignoredLeads = (leadsData ?? []).filter(l => !repliedLeadIdSet.has(l.id));

  const fmt = (leads: typeof leadsData) =>
    (leads ?? []).slice(0, 10).map(l => {
      const sigs = ((l.signal_data as Record<string, unknown>)?.signals as Array<{ text: string }> ?? [])
        .map(s => s.text).join(", ");
      return `Subject: ${l.generated_subject ?? ""}\nOpening: ${(l.generated_body ?? "").substring(0, 120)}\nSignals: ${sigs || "none"}`;
    }).join("\n---\n");

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `B2B cold email analyst. Identify reply-driving patterns.

REPLIED (${repliedLeads.length}):
${fmt(repliedLeads) || "No replied emails yet."}

IGNORED (${ignoredLeads.length}):
${fmt(ignoredLeads) || "No ignored emails yet."}

Return ONLY valid JSON:
{
  "best_opening_style": "8-12 word description",
  "best_subject_pattern": "8-12 word description",
  "winning_signals": ["signal 1", "signal 2"],
  "losing_patterns": ["pattern to avoid 1", "pattern to avoid 2"],
  "improvement_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "confidence_score": 72
}

Rules: winning_signals 2-3 items, losing_patterns 2 items, improvement_suggestions 3 items.
confidence_score 40-90 based on data volume (${repliedLeads.length} replied, ${ignoredLeads.length} ignored).
No emojis. No markdown.`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: "Analysis failed" }, { status: 500 });

  const parsed = JSON.parse(match[0]) as {
    best_opening_style?: string;
    best_subject_pattern?: string;
    winning_signals?: string[];
    losing_patterns?: string[];
    improvement_suggestions?: string[];
    confidence_score?: number;
  };

  const db = createAdminClient();

  if (existing) {
    await db.from("campaign_iq_insights").delete().eq("id", existing.id);
  }

  const { data: insight, error: insertError } = await db
    .from("campaign_iq_insights")
    .insert({
      user_id: user.id,
      campaign_id: null,
      best_opening_style: parsed.best_opening_style ?? "",
      best_subject_pattern: parsed.best_subject_pattern ?? "",
      winning_signals: Array.isArray(parsed.winning_signals) ? parsed.winning_signals : [],
      losing_patterns: Array.isArray(parsed.losing_patterns) ? parsed.losing_patterns : [],
      improvement_suggestions: Array.isArray(parsed.improvement_suggestions) ? parsed.improvement_suggestions : [],
      confidence_score: Math.min(100, Math.max(0, Number(parsed.confidence_score) || 65)),
      reply_count_at_analysis: currentReplyCount,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: "Failed to save insights" }, { status: 500 });
  return NextResponse.json({ insight, cached: false });
}
