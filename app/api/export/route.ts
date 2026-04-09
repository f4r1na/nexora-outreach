import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── CSV ─────────────────────────────────────────────────────────────────────

function escapeCSV(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function buildCSV(rows: string[][]): string {
  return rows.map((r) => r.map(escapeCSV).join(",")).join("\r\n");
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const campaignId = req.nextUrl.searchParams.get("campaignId");
  if (!campaignId) return new Response("campaignId is required", { status: 400 });

  // Fetch leads (RLS enforces ownership)
  const { data: leads, error } = await supabase
    .from("leads")
    .select("first_name, company, email, generated_subject, generated_body")
    .eq("campaign_id", campaignId)
    .order("created_at");

  if (error || !leads) return new Response("Failed to fetch leads", { status: 500 });

  const slug = campaignId.slice(0, 8);
  const rows: string[][] = [
    ["Name", "Company", "Email", "Subject", "Body"],
    ...leads.map((l) => [l.first_name ?? "", l.company ?? "", l.email ?? "", l.generated_subject ?? "", l.generated_body ?? ""]),
  ];
  return new Response(buildCSV(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nexora-${slug}.csv"`,
    },
  });
}
