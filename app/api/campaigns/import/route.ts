import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServiceClient();

  const { data: sub } = await db
    .from("subscriptions")
    .select("plan, credits_used, credits_limit")
    .eq("user_id", user.id)
    .single();

  const plan = sub?.plan ?? "free";
  if (plan !== "pro" && plan !== "agency") {
    return NextResponse.json(
      { error: "CSV import with signal detection requires a Pro or Agency plan." },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const campaignName = (formData.get("name") as string | null)?.trim() || null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length < 2) {
    return NextResponse.json(
      { error: "CSV must have a header row and at least one data row" },
      { status: 400 }
    );
  }

  const headers = rows[0].map(normalizeHeader);
  const col = (name: string): number => {
    const aliases: Record<string, string[]> = {
      first_name: ["first_name", "firstname", "first"],
      last_name:  ["last_name", "lastname", "last"],
      email:      ["email", "email_address"],
      company:    ["company", "company_name", "organization"],
      role:       ["role", "title", "job_title", "position"],
    };
    for (const alias of aliases[name] ?? [name]) {
      const i = headers.indexOf(alias);
      if (i !== -1) return i;
    }
    return -1;
  };

  if (col("email") === -1) {
    return NextResponse.json(
      { error: "CSV must have an 'email' column" },
      { status: 400 }
    );
  }

  type LeadInsert = {
    user_id: string;
    campaign_id: string;
    first_name: string;
    email: string;
    company: string | null;
    role: string | null;
    signal_status: string;
  };

  const dataRows = rows.slice(1);
  const leads: Omit<LeadInsert, "campaign_id">[] = [];

  for (const row of dataRows) {
    const email = row[col("email")]?.toLowerCase().trim();
    if (!email || !email.includes("@")) continue;

    const firstName = [
      col("first_name") >= 0 ? row[col("first_name")] ?? "" : "",
      col("last_name") >= 0 ? row[col("last_name")] ?? "" : "",
    ].filter(Boolean).join(" ").trim() || "Unknown";

    leads.push({
      user_id: user.id,
      first_name: firstName,
      email,
      company: col("company") >= 0 ? row[col("company")]?.trim() || null : null,
      role: col("role") >= 0 ? row[col("role")]?.trim() || null : null,
      signal_status: "queued",
    });
  }

  if (leads.length === 0) {
    return NextResponse.json(
      { error: "No valid leads found (email column is empty or malformed)" },
      { status: 400 }
    );
  }

  const name =
    campaignName ||
    file.name.replace(/\.csv$/i, "").trim() ||
    "Imported Campaign";

  const { data: campaign, error: campErr } = await db
    .from("campaigns")
    .insert({
      user_id: user.id,
      name,
      status: "draft",
      lead_count: leads.length,
      tone: "professional",
    })
    .select("id")
    .single();

  if (campErr || !campaign) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }

  const withCampaignId: LeadInsert[] = leads.map((l) => ({
    ...l,
    campaign_id: campaign.id,
  }));

  const BATCH = 500;
  for (let i = 0; i < withCampaignId.length; i += BATCH) {
    const { error: insertErr } = await db
      .from("leads")
      .insert(withCampaignId.slice(i, i + BATCH));
    if (insertErr) {
      console.error(
        JSON.stringify({
          step: "csv_import_insert_error",
          error: insertErr.message,
          offset: i,
        })
      );
    }
  }

  return NextResponse.json({ campaignId: campaign.id, leadCount: leads.length });
}
