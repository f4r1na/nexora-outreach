import { NextRequest } from "next/server";
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

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const db = getServiceClient();

    // Look up lead to get campaign_id
    const { data: lead } = await db
      .from("leads")
      .select("id, campaign_id")
      .eq("id", leadId)
      .maybeSingle();

    if (lead?.campaign_id) {
      // Look up campaign to get user_id
      const { data: campaign } = await db
        .from("campaigns")
        .select("user_id")
        .eq("id", lead.campaign_id)
        .maybeSingle();

      if (campaign?.user_id) {
        // Deduplicate: only insert first open per lead
        const { data: existing } = await db
          .from("email_events")
          .select("id")
          .eq("lead_id", leadId)
          .eq("event_type", "opened")
          .maybeSingle();

        if (!existing) {
          await db.from("email_events").insert({
            lead_id: leadId,
            campaign_id: lead.campaign_id,
            user_id: campaign.user_id,
            event_type: "opened",
          });
        }
      }
    }
  } catch {
    // Silent — never break email delivery over tracking
  }

  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
