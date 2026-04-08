import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType } from "docx";

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

// ─── Word ─────────────────────────────────────────────────────────────────────

async function buildWord(leads: { first_name: string | null; company: string | null; email: string | null; generated_subject: string | null; generated_body: string | null }[], campaignName: string): Promise<Buffer> {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const children: Paragraph[] = [
    // Title page
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400, after: 200 },
      children: [new TextRun({ text: "NEXORA OUTREACH", bold: true, size: 48, color: "FF5200" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: campaignName, size: 28, color: "444444" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [new TextRun({ text: `${leads.length} emails  ·  ${date}`, size: 20, color: "888888" })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  leads.forEach((lead, i) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: i === 0 ? 0 : 400, after: 80 },
        children: [new TextRun({ text: `${lead.first_name ?? ""}  ·  ${lead.company ?? ""}`, color: "FF5200", bold: true, size: 26 })],
      })
    );

    if (lead.email) {
      children.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: lead.email, italics: true, color: "888888", size: 18 })],
      }));
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 80 },
        children: [new TextRun({ text: lead.generated_subject ?? "", bold: true, size: 22 })],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: lead.generated_body ?? "", size: 20 })],
      })
    );

    if (i < leads.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const campaignId = req.nextUrl.searchParams.get("campaignId");
  const format = req.nextUrl.searchParams.get("format") ?? "csv";

  if (!campaignId) return new Response("campaignId is required", { status: 400 });

  // Plan check for gated formats
  const { data: sub } = await supabase.from("subscriptions").select("plan").eq("user_id", user.id).single();
  const plan = sub?.plan ?? "free";

  if (format === "docx" && plan !== "pro" && plan !== "agency") {
    return new Response(JSON.stringify({ error: "Word export requires Pro plan or higher" }), {
      status: 403, headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch campaign name
  const { data: campaign } = await supabase.from("campaigns").select("name").eq("id", campaignId).single();
  const campaignName = campaign?.name ?? "Campaign";

  // Fetch leads (RLS enforces ownership)
  const { data: leads, error } = await supabase
    .from("leads")
    .select("first_name, company, email, generated_subject, generated_body")
    .eq("campaign_id", campaignId)
    .order("created_at");

  if (error || !leads) return new Response("Failed to fetch leads", { status: 500 });

  const slug = campaignId.slice(0, 8);

  if (format === "docx") {
    const buf = await buildWord(leads, campaignName);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="nexora-${slug}.docx"`,
      },
    });
  }

  // CSV (always available)
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
