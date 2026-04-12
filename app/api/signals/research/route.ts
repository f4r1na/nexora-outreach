import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type InputLead = {
  first_name?: string;
  name?: string;
  company?: string;
  role?: string;
  email?: string;
  custom_note?: string;
};

export type SignalData = {
  company_insights: string;
  role_insights: string;
  pain_points: string[];
  talking_points: string[];
  recent_signals: string[];
  personalization_hooks: string[];
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getServiceClient();

    // Plan check: Pro/Agency only
    const { data: sub } = await db
      .from("subscriptions")
      .select("plan, credits_used, credits_limit")
      .eq("user_id", user.id)
      .single();

    const plan = sub?.plan ?? "free";
    if (plan !== "pro" && plan !== "agency") {
      return NextResponse.json(
        { error: "Signal Radar requires a Pro or Agency plan." },
        { status: 403 }
      );
    }

    let leads: InputLead[];
    try {
      const body = await req.json();
      leads = body.leads;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads provided" }, { status: 400 });
    }

    // Credits check
    const creditsUsed = sub?.credits_used ?? 0;
    const creditsLimit = sub?.credits_limit ?? 10;
    if (creditsLimit !== 999999 && creditsUsed + leads.length > creditsLimit) {
      return NextResponse.json(
        { error: `Not enough credits to research all leads (${creditsUsed}/${creditsLimit} used). Upgrade or reduce lead count.` },
        { status: 403 }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const results: Array<{
      lead_index: number;
      signal_data: SignalData | null;
      status: "done" | "failed";
    }> = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const firstName = lead.first_name || lead.name || "Unknown";
      const company = lead.company || "Unknown Company";
      const role = lead.role || "Unknown Role";
      const emailDomain = lead.email?.split("@")[1] || "";

      console.log(
        JSON.stringify({ step: "signal_research_start", lead_index: i, company, role })
      );

      try {
        const message = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 700,
          system: `You are a sales research assistant. Based on the following lead information, provide specific, actionable intelligence a salesperson can reference in a cold email. Focus on: likely company pain points, role-specific challenges, industry context, and compelling personalization angles. Be specific and practical. Never fabricate facts. Return ONLY a valid JSON object with exactly these keys: { "company_insights": string, "role_insights": string, "pain_points": string[], "talking_points": string[], "recent_signals": string[], "personalization_hooks": string[] }. No markdown, no code fences.`,
          messages: [
            {
              role: "user",
              content: `Research this lead for a cold outreach email:\nName: ${firstName}\nCompany: ${company}\nRole: ${role}${emailDomain ? `\nEmail domain: ${emailDomain}` : ""}${lead.custom_note ? `\nAdditional context: ${lead.custom_note}` : ""}\n\nProvide actionable sales intelligence. Keep each array to 2-3 items max.`,
            },
          ],
        });

        const raw =
          message.content[0].type === "text" ? message.content[0].text.trim() : "";
        const cleaned = raw
          .replace(/```json\s*/gi, "")
          .replace(/```/g, "")
          .trim();
        const parsed = JSON.parse(cleaned) as SignalData;

        results.push({ lead_index: i, signal_data: parsed, status: "done" });
        console.log(
          JSON.stringify({ step: "signal_research_done", lead_index: i, company })
        );
      } catch (leadErr: unknown) {
        const e = leadErr instanceof Error ? leadErr.message : String(leadErr);
        console.error(
          JSON.stringify({ step: "signal_research_error", lead_index: i, error: e })
        );
        results.push({ lead_index: i, signal_data: null, status: "failed" });
      }

      if (i < leads.length - 1) {
        await sleep(500);
      }
    }

    // Consume credits for successful researches
    const successCount = results.filter((r) => r.status === "done").length;
    if (successCount > 0) {
      await db
        .from("subscriptions")
        .update({ credits_used: creditsUsed + successCount })
        .eq("user_id", user.id);
    }

    console.log(
      JSON.stringify({
        step: "signal_research_complete",
        total: leads.length,
        success: successCount,
      })
    );

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ step: "signal_research_fatal", error: msg }));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
