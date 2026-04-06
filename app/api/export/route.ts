import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  AlignmentType,
} from "docx";

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

// ─── Types ───────────────────────────────────────────────────────────────────

type Lead = {
  first_name: string | null;
  company: string | null;
  email: string | null;
  generated_subject: string | null;
  generated_body: string | null;
};

// ─── PDF ─────────────────────────────────────────────────────────────────────

function buildPDF(leads: Lead[], campaignName: string): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 52;
  const contentW = pageW - margin * 2;

  const ORANGE: [number, number, number] = [255, 82, 0];
  const WHITE: [number, number, number] = [255, 255, 255];
  const BLACK: [number, number, number] = [20, 20, 20];
  const GRAY: [number, number, number] = [110, 110, 110];

  // Helper: draw footer on current page
  function drawFooter(page: number) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text("nexora-outreach.vercel.app", margin, pageH - 24);
    doc.text(`Page ${page}`, pageW - margin, pageH - 24, { align: "right" });
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, pageH - 34, pageW - margin, pageH - 34);
  }

  let page = 1;

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW, 72, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text("NEXORA OUTREACH", margin, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(255, 200, 170);
  doc.text(campaignName, margin, 52);

  doc.setFontSize(9);
  doc.text(`${leads.length} emails  ·  Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, pageW - margin, 52, { align: "right" });

  drawFooter(page);

  let y = 100;

  // ── Emails ───────────────────────────────────────────────────────────────────
  leads.forEach((lead, i) => {
    const subject = lead.generated_subject ?? "";
    const body = lead.generated_body ?? "";
    const subjectLines = doc.splitTextToSize(subject, contentW - 10);
    const bodyLines = doc.splitTextToSize(body, contentW);
    const blockH = 18 + 14 + subjectLines.length * 14 + 6 + bodyLines.length * 13 + 28;

    // Page break if needed (leave room for footer)
    if (y + blockH > pageH - 50) {
      doc.addPage();
      page++;

      // Re-draw orange header strip (smaller) on subsequent pages
      doc.setFillColor(...ORANGE);
      doc.rect(0, 0, pageW, 28, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...WHITE);
      doc.text("NEXORA OUTREACH", margin, 18);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 200, 170);
      doc.text(campaignName, pageW - margin, 18, { align: "right" });

      drawFooter(page);
      y = 50;
    }

    // Lead name + company in orange
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...ORANGE);
    doc.text(`${lead.first_name ?? ""}  ·  ${lead.company ?? ""}`, margin, y);
    y += 18;

    // Email address
    if (lead.email) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...GRAY);
      doc.text(lead.email, margin, y);
      y += 14;
    }

    // Subject
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text(subjectLines, margin, y);
    y += subjectLines.length * 14 + 6;

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    doc.text(bodyLines, margin, y);
    y += bodyLines.length * 13;

    // Divider (skip after last)
    if (i < leads.length - 1) {
      y += 14;
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageW - margin, y);
      y += 14;
    }
  });

  return Buffer.from(doc.output("arraybuffer"));
}

// ─── Word ─────────────────────────────────────────────────────────────────────

async function buildWord(leads: Lead[], campaignName: string): Promise<Buffer> {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // Title section (own page)
  const titleSection = {
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400 },
        children: [
          new TextRun({ text: "NEXORA OUTREACH", bold: true, size: 48, color: "FF5200" }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [
          new TextRun({ text: campaignName, size: 28, color: "444444" }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 160 },
        children: [
          new TextRun({ text: `${leads.length} emails  ·  ${date}`, size: 20, color: "888888" }),
        ],
      }),
      new Paragraph({
        children: [new PageBreak()],
      }),
    ],
  };

  // Emails section
  const emailChildren: Paragraph[] = [];

  leads.forEach((lead, i) => {
    // Lead heading (orange)
    emailChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: i === 0 ? 0 : 400, after: 80 },
        children: [
          new TextRun({
            text: `${lead.first_name ?? ""}  ·  ${lead.company ?? ""}`,
            color: "FF5200",
            bold: true,
            size: 26,
          }),
        ],
      })
    );

    // Email address
    if (lead.email) {
      emailChildren.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: lead.email, italics: true, color: "888888", size: 18 })],
        })
      );
    }

    // Subject (heading 2)
    emailChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 80 },
        children: [
          new TextRun({ text: lead.generated_subject ?? "", bold: true, size: 22 }),
        ],
      })
    );

    // Body
    emailChildren.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: lead.generated_body ?? "", size: 20 })],
      })
    );

    // Page break between emails (not after last)
    if (i < leads.length - 1) {
      emailChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  const doc = new Document({
    sections: [titleSection, { children: emailChildren }],
  });

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

  // Fetch plan for gated formats
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = sub?.plan ?? "free";

  if (format === "pdf" && (plan === "free" || plan === "starter")) {
    return new Response("PDF export requires Pro plan or higher", { status: 403 });
  }
  if (format === "docx" && plan !== "agency") {
    return new Response("Word export requires Agency plan", { status: 403 });
  }

  // Fetch campaign name
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("name")
    .eq("id", campaignId)
    .single();

  const campaignName = campaign?.name ?? "Campaign";

  // Fetch leads (RLS ensures user owns them)
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

  // CSV (default, always available)
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
      "Content-Disposition": `attachment; filename="nexora-${slug}.csv"`,
    },
  });
}
