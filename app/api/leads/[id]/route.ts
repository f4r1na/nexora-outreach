import { createClient } from "@/lib/supabase/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { data: lead } = await supabase
    .from("leads")
    .select("id, campaign_id")
    .eq("id", id)
    .single()

  if (!lead) return Response.json({ error: "Not found" }, { status: 404 })

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", lead.campaign_id)
    .eq("user_id", user.id)
    .single()

  if (!campaign) return Response.json({ error: "Forbidden" }, { status: 403 })

  await supabase.from("leads").delete().eq("id", id)

  return Response.json({ ok: true })
}
