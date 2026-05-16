import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { leadIds }: { leadIds: string[] } = await req.json()
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return Response.json({ error: "leadIds required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { data: leads } = await supabase
    .from("leads")
    .select("id, campaign_id")
    .in("id", leadIds)

  if (!leads || leads.length === 0) return Response.json({ ok: true, deleted: 0 })

  const campaignIds = [...new Set(leads.map(l => l.campaign_id))]
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .in("id", campaignIds)
    .eq("user_id", user.id)

  const ownedIds = new Set((campaigns ?? []).map(c => c.id))
  const safeLeadIds = leads.filter(l => ownedIds.has(l.campaign_id)).map(l => l.id)

  if (safeLeadIds.length > 0) {
    await supabase.from("leads").delete().in("id", safeLeadIds)
  }

  return Response.json({ ok: true, deleted: safeLeadIds.length })
}
