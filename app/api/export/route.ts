import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";
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

// ─── PDF ─────────────────────────────────────────────────────────────────────

function buildPDF(leads: { first_name: string | null; company: string | null; email: string | null; generated_subject: string | null; generated_body: string | null }[], campaignName: string): Buffer {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;

  let page = 1;

  function drawHeader() {
    // Orange header bar
    doc.setFillColor(255, 82, 0);
    doc.rect(0, 0, pageW, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("NEXORA OUTREACH", margin, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(255, 210, 190);
    doc.text(campaignName, pageW - margin, 16, { align: "right" });
  }

  function drawFooter() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("nexora-outreach.vercel.app", margin, pageH - 8);
    doc.text(`Page ${page}`, pageW - margin, pageH - 8, { align: "right" });
  }

  drawHeader();
  drawFooter();

  let y = 35;

  leads.forEach((lead, i) => {
    const subject = lead.generated_subject ?? "";
    const body = lead.generated_body ?? "";
    const subjectLines = doc.splitTextToSize(subject, contentW);
    const bodyLines = doc.splitTextToSize(body, contentW);
    const blockH = 8 + 6 + subjectLines.length * 6 + 5 + bodyLines.length * 5.5 + 10;

    if (y + blockH > pageH - 16) {
      doc.addPage();
      page++;
      drawHeader();
      drawFooter();
      y = 35;
    }

    // Lead name + company in orange
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 82, 0);
    doc.text(`${lead.first_name ?? ""}  ·  ${lead.company ?? ""}`, margin, y);
    y += 6;

    // Email
    if (lead.email) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(lead.email, margin, y);
      y += 5;
    }

    y += 2;

    // Subject
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(subjectLines, margin, y);
    y += subjectLines.length * 6 + 3;

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(bodyLines, margin, y);
    y += bodyLines.length * 5.5 + 8;

    // Divider (except after last)
    if (i < leads.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    }
  });

  return Buffer.from(doc.output("arraybuffer"));
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

  if (format === "pdf" && plan !== "pro" && plan !== "agency") {
    return new Response(JSON.stringify({ error: "PDF export requires Pro plan or higher" }), {
      status: 403, headers: { "Content-Type": "application/json" },
    });
  }
  if (format === "docx" && plan !== "agency") {
    return new Response(JSON.stringify({ error: "Word export requires Agency plan" }), {
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

  if (format === "pdf") {
    const buf = buildPDF(leads, campaignName);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="nexora-${slug}.pdf"`,
      },
    });
  }

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
