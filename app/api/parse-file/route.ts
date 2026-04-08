import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── Text → leads parser (shared with client, duplicated here for server use) ──

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_-]+/g, "_").replace(/[^a-z_]/g, "");
}

function findIdx(headers: string[], ...keys: string[]): number {
  for (const key of keys) {
    const i = headers.findIndex((h) => h === key || h.startsWith(key));
    if (i >= 0) return i;
  }
  return -1;
}

function textToLeads(text: string) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  for (const sep of [",", "\t", ";"]) {
    if (!lines[0].includes(sep)) continue;
    const rawHeaders = lines[0].split(sep).map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const headers = rawHeaders.map(normalizeHeader);
    const nameIdx    = findIdx(headers, "first_name", "name", "firstname", "full_name");
    const companyIdx = findIdx(headers, "company", "organization", "org", "employer");
    const roleIdx    = findIdx(headers, "role", "title", "job_title", "position", "job");
    const emailIdx   = findIdx(headers, "email", "email_address", "mail");
    const noteIdx    = findIdx(headers, "custom_note", "note", "notes", "message", "context");
    if (nameIdx < 0 && emailIdx < 0) continue;
    const results = lines.slice(1).filter((l) => l.trim()).map((line) => {
      const cols = line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const get = (idx: number) => (idx >= 0 && cols[idx] !== undefined ? cols[idx] : "");
      return { first_name: get(nameIdx), company: get(companyIdx), role: get(roleIdx), email: get(emailIdx), custom_note: get(noteIdx) };
    }).filter((l) => l.first_name || l.email);
    if (results.length > 0) return results;
  }

  // Fallback: extract by email address
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const leads: { first_name: string; company: string; role: string; email: string; custom_note: string }[] = [];
  for (const line of lines) {
    const match = line.match(emailRe);
    if (match) {
      const email = match[0];
      const rest = line.replace(email, "").replace(/[,|;:\t]+/g, " ").trim();
      const name = rest.split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
      leads.push({ first_name: name, company: "", role: "", email, custom_note: "" });
    }
  }
  return leads;
}

// ── Route — handles DOCX only (PDF is parsed client-side via pdfjs-dist) ──────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sub } = await supabase.from("subscriptions").select("plan").eq("user_id", user.id).single();
  const plan = sub?.plan ?? "free";

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  console.log("[parse-file] file:", file.name, "ext:", ext, "plan:", plan);

  if (ext === "docx") {
    if (plan !== "agency") {
      return NextResponse.json({ error: "Word uploads require Agency plan" }, { status: 403 });
    }
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      console.log("[parse-file] DOCX text length:", result.value.length);
      const leads = textToLeads(result.value);
      console.log("[parse-file] DOCX leads extracted:", leads.length);
      return NextResponse.json({ leads });
    } catch (err: any) {
      console.error("[parse-file] DOCX parse error:", err.message);
      return NextResponse.json({ error: "Failed to parse Word document: " + err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported file type. Only .docx is handled server-side." }, { status: 400 });
}
