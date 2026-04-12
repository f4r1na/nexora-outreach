import { NextRequest } from "next/server";
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
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SYSTEM_PROMPTS: Record<number, string> = {
  1: "Write a friendly follow-up to a cold email that got no response. Reference the original email briefly. Keep it shorter than the original. End with a soft CTA. Don't be pushy or guilt-trip.",
  2: "Write a second follow-up. Try a different angle — maybe share a quick case study, stat, or social proof. Very short, 2-3 sentences max. Light and casual.",
  3: "Write a final breakup email. Let them know this is the last email. Keep it gracious and leave the door open. One sentence offering to help if they ever need it.",
};

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  function event(controller: ReadableStreamDefaultController, data: Record<string, unknown>) {
    controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── Auth ─────────────────────────────────────────────────────────────
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          event(controller, { type: "error", message: "Unauthorized" });
          controller.close();
          return;
        }

        // ── Parse body ───────────────────────────────────────────────────────
        let campaignId: string;
        let delays: [number, number, number] = [3, 5, 7];
        try {
          const body = await req.json();
          campaignId = body.campaign_id;
          if (Array.isArray(body.delays) && body.delays.length === 3) {
            delays = body.delays as [number, number, number];
          }
        } catch {
          event(controller, { type: "error", message: "Invalid request body" });
          controller.close();
          return;
        }

        if (!campaignId) {
          event(controller, { type: "error", message: "campaign_id is required" });
          controller.close();
          return;
        }

        const db = getServiceClient();

        // ── Plan check ───────────────────────────────────────────────────────
        const { data: sub } = await db
          .from("subscriptions")
          .select("plan, credits_used, credits_limit")
          .eq("user_id", user.id)
          .single();

        const plan = sub?.plan ?? "free";
        if (plan !== "pro" && plan !== "agency") {
          event(controller, { type: "error", message: "Pro or Agency plan required for follow-up sequences" });
          controller.close();
          return;
        }

        // ── Verify campaign ownership ─────────────────────────────────────────
        const { data: campaign } = await db
          .from("campaigns")
          .select("id, name")
          .eq("id", campaignId)
          .eq("user_id", user.id)
          .single();

        if (!campaign) {
          event(controller, { type: "error", message: "Campaign not found" });
          controller.close();
          return;
        }

        // ── Fetch leads ──────────────────────────────────────────────────────
        const { data: leads } = await db
          .from("leads")
          .select("id, first_name, company, role, email, generated_subject, generated_body, signal_data")
          .eq("campaign_id", campaignId)
          .order("created_at");

        if (!leads || leads.length === 0) {
          event(controller, { type: "error", message: "No leads found in this campaign" });
          controller.close();
          return;
        }

        // ── Credits check ────────────────────────────────────────────────────
        const creditsUsed: number = sub?.credits_used ?? 0;
        const creditsLimit: number = sub?.credits_limit ?? 10;
        const totalNeeded = leads.length * 3; // 3 follow-ups per lead

        if (creditsLimit !== 999999 && creditsUsed + totalNeeded > creditsLimit) {
          event(controller, { type: "error", message: `Not enough credits. Need ${totalNeeded}, have ${creditsLimit - creditsUsed} remaining.` });
          controller.close();
          return;
        }

        // ── Check for existing sequences (avoid duplicates) ──────────────────
        const { data: existingSeqs } = await db
          .from("follow_up_sequences")
          .select("id")
          .eq("campaign_id", campaignId)
          .eq("user_id", user.id);

        if (existingSeqs && existingSeqs.length > 0) {
          event(controller, { type: "error", message: "Follow-up sequences already exist for this campaign" });
          controller.close();
          return;
        }

        // ── Ghost Writer style ───────────────────────────────────────────────
        const { data: writingStyle } = await db
          .from("writing_styles")
          .select("style_summary")
          .eq("user_id", user.id)
          .maybeSingle();
        const ghostStyle: string | null = writingStyle?.style_summary ?? null;

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const baseDate = new Date();
        let totalScheduled = 0;
        let creditsConsumed = 0;

        console.log(JSON.stringify({ step: "followup_generate_start", campaign_id: campaignId, leads: leads.length }));
        event(controller, { type: "start", totalLeads: leads.length, delays });

        // ── Generate 3 sequences ─────────────────────────────────────────────
        for (let fuNum = 1; fuNum <= 3; fuNum++) {
          const delayDays = delays[fuNum - 1];
          const scheduledAt = new Date(baseDate.getTime() + delayDays * 24 * 60 * 60 * 1000);

          // Create sequence row
          const { data: seq, error: seqErr } = await db
            .from("follow_up_sequences")
            .insert({
              campaign_id: campaignId,
              user_id: user.id,
              follow_up_number: fuNum,
              delay_days: delayDays,
              status: "generating",
            })
            .select("id")
            .single();

          if (seqErr || !seq) {
            event(controller, { type: "error", message: `Failed to create sequence ${fuNum}: ${seqErr?.message}` });
            controller.close();
            return;
          }

          event(controller, { type: "sequence_start", followupNum: fuNum, totalLeads: leads.length, delayDays });
          console.log(JSON.stringify({ step: "followup_sequence_created", seq_id: seq.id, follow_up_number: fuNum }));

          const systemPrompt = SYSTEM_PROMPTS[fuNum];
          const emailRows: Array<{
            sequence_id: string;
            lead_id: string;
            campaign_id: string;
            user_id: string;
            follow_up_number: number;
            subject: string;
            body: string;
            scheduled_at: string;
            status: string;
          }> = [];

          // Generate email for each lead
          for (let li = 0; li < leads.length; li++) {
            const lead = leads[li];

            try {
              const signalInstruction = lead.signal_data && Object.keys(lead.signal_data).length > 0
                ? `\n\nSIGNAL RADAR INTELLIGENCE (use naturally, don't list):\n${JSON.stringify(lead.signal_data)}`
                : "";

              const styleInstruction = ghostStyle
                ? `\n\nWrite in this personal style:\n${ghostStyle}`
                : "";

              const userPrompt = `Return ONLY a raw JSON object with "subject" and "body" keys. No markdown, no code fences.

Original email sent:
Subject: ${lead.generated_subject ?? "(none)"}
Body: ${lead.generated_body ?? "(none)"}

Lead: ${lead.first_name ?? "there"}, ${lead.role ?? ""} at ${lead.company ?? "their company"}
Follow-up #${fuNum} — ${systemPrompt}${signalInstruction}${styleInstruction}`;

              const message = await anthropic.messages.create({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 400,
                system: systemPrompt,
                messages: [{ role: "user", content: userPrompt }],
              });

              const raw = message.content[0].type === "text" ? message.content[0].text : "";
              const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

              let parsed: { subject: string; body: string };
              try {
                parsed = JSON.parse(cleaned);
              } catch {
                parsed = { subject: `Follow-up #${fuNum}: ${lead.generated_subject ?? ""}`, body: raw };
              }

              emailRows.push({
                sequence_id: seq.id,
                lead_id: lead.id,
                campaign_id: campaignId,
                user_id: user.id,
                follow_up_number: fuNum,
                subject: parsed.subject,
                body: parsed.body,
                scheduled_at: scheduledAt.toISOString(),
                status: "scheduled",
              });

              creditsConsumed++;
            } catch (leadErr: unknown) {
              const msg = leadErr instanceof Error ? leadErr.message : String(leadErr);
              console.error(JSON.stringify({ step: "followup_lead_error", follow_up_number: fuNum, lead_id: lead.id, error: msg }));
              // Push fallback
              emailRows.push({
                sequence_id: seq.id,
                lead_id: lead.id,
                campaign_id: campaignId,
                user_id: user.id,
                follow_up_number: fuNum,
                subject: `Follow-up #${fuNum}`,
                body: `Hi ${lead.first_name ?? "there"}, just wanted to circle back on my previous email. Would love to connect!`,
                scheduled_at: scheduledAt.toISOString(),
                status: "scheduled",
              });
              creditsConsumed++;
            }

            event(controller, { type: "lead_done", followupNum: fuNum, leadIndex: li + 1, totalLeads: leads.length });

            if (li < leads.length - 1) await sleep(300);
          }

          // Bulk insert all emails for this sequence
          const { error: insertErr } = await db.from("follow_up_emails").insert(emailRows);
          if (insertErr) {
            console.error(JSON.stringify({ step: "followup_emails_insert_error", error: insertErr.message }));
            event(controller, { type: "error", message: `Failed to save follow-up ${fuNum} emails: ${insertErr.message}` });
            controller.close();
            return;
          }

          // Update sequence status to 'ready'
          await db.from("follow_up_sequences").update({ status: "ready" }).eq("id", seq.id);

          totalScheduled += emailRows.length;
          event(controller, { type: "sequence_done", followupNum: fuNum, count: emailRows.length });
          console.log(JSON.stringify({ step: "followup_sequence_ready", seq_id: seq.id, emails: emailRows.length }));
        }

        // ── Increment credits ─────────────────────────────────────────────────
        if (creditsConsumed > 0 && creditsLimit !== 999999) {
          await db.from("subscriptions")
            .update({ credits_used: creditsUsed + creditsConsumed })
            .eq("user_id", user.id);
        }

        console.log(JSON.stringify({ step: "followup_generate_done", campaign_id: campaignId, scheduled: totalScheduled }));
        event(controller, { type: "done", scheduled: totalScheduled });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ step: "followup_generate_fatal", error: msg }));
        event(controller, { type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
