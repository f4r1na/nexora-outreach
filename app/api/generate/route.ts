import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { campaignName, tone, leads } = await req.json();

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

  const { data: campaign } = await supabase.from("campaigns").insert({
    user_id: user.id,
    name: campaignName,
    tone,
    status: "complete",
    lead_count: leads.length,
  }).select().single();

  const results = [];

  for (const lead of leads) {
    const note = lead.note || lead.custom_note || "";
    console.log("GENERATING FOR:", lead.name, "NOTE:", note);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Write a cold email. Return only JSON with "subject" and "body" keys.

Name: ${lead.name}
Company: ${lead.company}
Role: ${lead.role}
Situation: ${note}

The email body MUST start by directly mentioning: "${note}"
Tone: ${tone}
Max 3 sentences in body.
No generic openers. Reference the situation in the first word.`
      }]
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const json = JSON.parse(text.replace(/```json|```/g, "").trim());

    if (campaign) {
      await supabase.from("leads").insert({
        campaign_id: campaign.id,
        first_name: lead.name,
        company: lead.company,
        role: lead.role,
        email: lead.email,
        custom_note: note,
        generated_subject: json.subject,
        generated_body: json.body,
      });
    }

    results.push({ ...lead, subject: json.subject, body: json.body });
  }

  // Increment credits used
  await supabase
    .from("subscriptions")
    .upsert({
      user_id: user.id,
      credits_used: creditsUsed + leads.length,
      credits_limit: creditsLimit,
    }, { onConflict: "user_id" });

  return NextResponse.json({ campaignId: campaign?.id, emails: results });
}
