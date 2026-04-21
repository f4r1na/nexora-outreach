import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const body = await req.json();
    const { campaignName, tone, leads } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads provided" }, { status: 400 });
    }
    if (leads.length > 100) {
      return NextResponse.json({ error: "Too many leads (max 100)" }, { status: 400 });
    }
    if (typeof campaignName !== "string" || campaignName.length > 200) {
      return NextResponse.json({ error: "Invalid campaign name" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Credit check
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("credits_used, credits_limit")
      .eq("user_id", user.id)
      .single();

    const creditsUsed = sub?.credits_used ?? 0;
    const creditsLimit = sub?.credits_limit ?? 10;

    if (creditsUsed + leads.length > creditsLimit) {
      return NextResponse.json(
        { error: "Credit limit reached. Upgrade your plan to generate more emails." },
        { status: 403 }
      );
    }

    // Check for Ghost Writer style (Agency plan)
    const db = getServiceClient();
    const { data: writingStyle } = await db
      .from("writing_styles")
      .select("style_summary")
      .eq("user_id", user.id)
      .maybeSingle();

    const ghostWriterStyle: string | null = writingStyle?.style_summary ?? null;

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name: campaignName,
        tone,
        status: "complete",
        lead_count: leads.length,
      })
      .select()
      .single();

    if (campaignError) {
      console.error("Campaign insert error:", campaignError);
      return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
    }

    const results = [];

    for (const lead of leads) {
      const note = lead.note || lead.custom_note || "";

      try {
        const styleInstruction = ghostWriterStyle
          ? `\n\nIMPORTANT: Write in the user's personal style. Here is their style guide:\n${ghostWriterStyle}\nMatch their tone, sentence structure, vocabulary, and patterns exactly.`
          : "";

        const signalData = lead.signal_data || null;
        const signalInstruction = signalData
          ? `\n\nSIGNAL RADAR INTELLIGENCE — Use this research to make the email hyper-personalized. Weave in specific details naturally; do not list them:\n${JSON.stringify(signalData)}`
          : "";

        const leadName = lead.name || lead.first_name || "";

        const message = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: `Write a cold email. Return ONLY a raw JSON object with "subject" and "body" keys. No markdown, no code fences, no explanation.

Name: ${leadName}
Company: ${lead.company}
Role: ${lead.role}
Situation: ${note}

The email body MUST start by directly mentioning: "${note}"
Tone: ${tone}
Max 3 sentences in body.
No generic openers. Reference the situation in the first word.${signalInstruction}${styleInstruction}`
          }]
        });

        const raw = message.content[0].type === "text" ? message.content[0].text : "";

        const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

        let parsed: { subject: string; body: string };
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = { subject: `Email for ${lead.name}`, body: raw };
        }

        if (campaign) {
          await supabase.from("leads").insert({
            campaign_id: campaign.id,
            first_name: lead.name || lead.first_name,
            company: lead.company,
            role: lead.role,
            email: lead.email,
            custom_note: note,
            generated_subject: parsed.subject,
            generated_body: parsed.body,
            signal_data: signalData ?? null,
            signal_status: signalData ? "done" : "pending",
          });
        }

        results.push({ ...lead, subject: parsed.subject, body: parsed.body });
      } catch (leadErr: unknown) {
        const msg = leadErr instanceof Error ? leadErr.message : String(leadErr);
        console.error("generate lead error:", msg);
        // Push a fallback so the rest of the campaign still completes
        results.push({
          ...lead,
          subject: `Introduction for ${lead.name}`,
          body: `Hi ${lead.name}, I wanted to reach out regarding an opportunity that may be relevant to your work at ${lead.company}.`,
        });
      }
    }

    // Increment credits used
    await supabase
      .from("subscriptions")
      .upsert(
        { user_id: user.id, credits_used: creditsUsed + results.length, credits_limit: creditsLimit },
        { onConflict: "user_id" }
      );

    return NextResponse.json({ campaignId: campaign.id, emails: results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("generate route error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
