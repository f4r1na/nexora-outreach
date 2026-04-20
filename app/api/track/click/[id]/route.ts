import { NextRequest, NextResponse } from "next/server";
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let targetUrl = "https://nexoraoutreach.com";

  try {
    const { id } = await params;
    const decoded = JSON.parse(
      Buffer.from(id, "base64url").toString("utf-8")
    ) as { lead_id: string; url: string };

    const { lead_id: leadId, url } = decoded;
    targetUrl = url;

    const db = getServiceClient();

    const { data: lead } = await db
      .from("leads")
      .select("id, campaign_id")
      .eq("id", leadId)
      .maybeSingle();

    if (lead?.campaign_id) {
      const { data: campaign } = await db
        .from("campaigns")
        .select("user_id")
        .eq("id", lead.campaign_id)
        .maybeSingle();

      if (campaign?.user_id) {
        // Deduplicate per lead + url combo
        const { data: existing } = await db
          .from("email_events")
          .select("id")
          .eq("lead_id", leadId)
          .eq("event_type", "clicked")
          .eq("metadata->>url", url)
          .maybeSingle();

        if (!existing) {
          await db.from("email_events").insert({
            lead_id: leadId,
            campaign_id: lead.campaign_id,
            user_id: campaign.user_id,
            event_type: "clicked",
            metadata: { url },
          });
        }
      }
    }
  } catch {
    // Silent
  }

  return NextResponse.redirect(targetUrl, 302);
}
