import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCSV(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
}

type Lead = {
  first_name: string | null;
  company: string | null;
  email: string | null;
  generated_subject: string | null;
  generated_body: string | null;
};

function buildPDF(leads: Lead[], campaignId: string): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 50;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Nexora Outreach — Campaign Emails", margin, y);
  y += 30;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Campaign ID: ${campaignId}  •  ${leads.length} emails`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 30;

  leads.forEach((lead, i) => {
    if (y > 700) { doc.addPage(); y = margin; }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`${i + 1}. ${lead.first_name ?? ""} — ${lead.company ?? ""}`, margin, y);
    y += 16;

    if (lead.email) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(lead.email, margin, y);
      doc.setTextColor(0, 0, 0);
      y += 14;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Subject:", margin, y);
    doc.setFont("helvetica", "normal");
    const subjectLines = doc.splitTextToSize(lead.generated_subject ?? "", maxWidth - 50);
    doc.text(subjectLines, margin + 48, y);
    y += subjectLines.length * 14 + 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Body:", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const bodyLines = doc.splitTextToSize(lead.generated_body ?? "", maxWidth);
    doc.text(bodyLines, margin, y);
    y += bodyLines.length * 12 + 24;

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y - 12, pageWidth - margin, y - 12);
  });

  return Buffer.from(doc.output("arraybuffer"));
}

async function buildWord(leads: Lead[], campaignId: string): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      text: "Nexora Outreach — Campaign Emails",
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [new TextRun({ text: `Campaign ID: ${campaignId}  •  ${leads.length} emails`, color: "888888", size: 18 })],
    }),
    new Paragraph({ text: "" }),
  ];

  leads.forEach((lead, i) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: `${i + 1}. ${lead.first_name ?? ""} — ${lead.company ?? ""}` })],
      })
    );

    if (lead.email) {
      children.push(new Paragraph({
        children: [new TextRun({ text: lead.email, italics: true, color: "666666", size: 18 })],
      }));
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Subject: ", bold: true }),
          new TextRun({ text: lead.generated_subject ?? "" }),
        ],
      }),
      new Paragraph({
        children: [new TextRun({ text: "Body:", bold: true })],
      }),
      new Paragraph({ text: lead.generated_body ?? "" }),
      new Paragraph({ text: "" }),
    );
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const campaignId = req.nextUrl.searchParams.get("campaignId");
  const format = req.nextUrl.searchParams.get("format") ?? "csv";

  if (!campaignId) return new Response("campaignId is required", { status: 400 });

  // Check plan for gated formats
  if (format === "pdf" || format === "docx") {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const plan = sub?.plan ?? "free";

    if (format === "pdf" && plan === "free") {
      return new Response("PDF export requires Starter plan or higher", { status: 403 });
    }
    if (format === "docx" && (plan === "free" || plan === "starter")) {
      return new Response("Word export requires Pro plan or higher", { status: 403 });
    }
  }

  const { data: leads, error } = await supabase
    .from("leads")
    .select("first_name, company, email, generated_subject, generated_body")
    .eq("campaign_id", campaignId)
    .order("created_at");

  if (error) return new Response("Failed to fetch leads", { status: 500 });

  const slug = campaignId.slice(0, 8);

  if (format === "pdf") {
    const buf = buildPDF(leads, campaignId);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="nexora-campaign-${slug}.pdf"`,
      },
    });
  }

  if (format === "docx") {
    const buf = await buildWord(leads, campaignId);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="nexora-campaign-${slug}.docx"`,
      },
    });
  }

  // Default: CSV
  const rows: string[][] = [
    ["Name", "Company", "Email", "Subject", "Body"],
    ...leads.map((l) => [
      l.first_name ?? "",
      l.company ?? "",
      l.email ?? "",
      l.generated_subject ?? "",
      l.generated_body ?? "",
    ]),
  ];

  return new Response(buildCSV(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nexora-campaign-${slug}.csv"`,
    },
  });
}
