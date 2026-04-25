import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Field = "first_name" | "last_name" | "email" | "company" | "title" | "subject" | "body" | "ignore";

const VALID_FIELDS: Field[] = ["first_name", "last_name", "email", "company", "title", "subject", "body", "ignore"];
const MAX_ROWS = 5000;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    fileName?: string;
    headers?: unknown;
    rows?: unknown;
    mapping?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { fileName, headers, rows, mapping } = body;

  if (!Array.isArray(headers) || !Array.isArray(rows) || !Array.isArray(mapping)) {
    return NextResponse.json({ error: "Invalid CSV payload" }, { status: 400 });
  }
  if (mapping.length !== headers.length) {
    return NextResponse.json({ error: "Mapping length mismatch" }, { status: 400 });
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV has no rows" }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `CSV exceeds ${MAX_ROWS} rows` }, { status: 400 });
  }

  const map = mapping as Field[];
  if (!map.every((m) => VALID_FIELDS.includes(m))) {
    return NextResponse.json({ error: "Invalid mapping field" }, { status: 400 });
  }
  for (const required of ["first_name", "email"] as Field[]) {
    if (!map.includes(required)) {
      return NextResponse.json({ error: `Missing required column: ${required}` }, { status: 400 });
    }
  }

  const idx: Record<Field, number> = {
    first_name: map.indexOf("first_name"),
    last_name: map.indexOf("last_name"),
    email: map.indexOf("email"),
    company: map.indexOf("company"),
    title: map.indexOf("title"),
    subject: map.indexOf("subject"),
    body: map.indexOf("body"),
    ignore: -1,
  };

  // Plan / credits
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("credits_used, credits_limit")
    .eq("user_id", user.id)
    .single();

  const creditsUsed: number = sub?.credits_used ?? 0;
  const creditsLimit: number = sub?.credits_limit ?? 10;
  const remaining = creditsLimit - creditsUsed;

  // Build & validate leads. Keep first occurrence of each email; skip later duplicates.
  // No DB lookup — only validate format.
  const seen = new Set<string>();
  const leadsToInsert: {
    first_name: string;
    company: string | null;
    role: string | null;
    email: string;
    custom_note: null;
    generated_subject: string | null;
    generated_body: string | null;
  }[] = [];
  let skippedNoEmail = 0;
  let skippedBadEmail = 0;
  let skippedDuplicate = 0;

  const cell = (row: string[], i: number) => {
    if (i < 0) return "";
    const v = row[i];
    // Strip BOM and zero-width spaces that survive CSV parsing
    return (v ?? "").toString().replace(/[﻿​]/g, "").trim();
  };

  for (const rawRow of rows as unknown[]) {
    if (!Array.isArray(rawRow)) {
      skippedNoEmail++;
      continue;
    }
    const row = rawRow as string[];
    const first = cell(row, idx.first_name);
    const last = cell(row, idx.last_name);
    const email = cell(row, idx.email).toLowerCase();
    const company = cell(row, idx.company);
    const title = cell(row, idx.title);
    const subject = cell(row, idx.subject);
    const bodyText = cell(row, idx.body);

    if (!email) {
      skippedNoEmail++;
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      skippedBadEmail++;
      continue;
    }
    if (seen.has(email)) {
      skippedDuplicate++;
      continue;
    }
    seen.add(email);

    leadsToInsert.push({
      first_name: last ? `${first} ${last}`.trim() || email.split("@")[0] : first || email.split("@")[0],
      company: company || null,
      role: title || null,
      email,
      custom_note: null,
      generated_subject: subject || null,
      generated_body: bodyText || null,
    });
  }

  const skipped = skippedNoEmail + skippedBadEmail + skippedDuplicate;

  if (leadsToInsert.length === 0) {
    return NextResponse.json(
      {
        error: "No valid leads found in CSV",
        details: {
          totalRows: rows.length,
          skippedNoEmail,
          skippedBadEmail,
          skippedDuplicate,
        },
      },
      { status: 400 }
    );
  }

  if (leadsToInsert.length > remaining) {
    return NextResponse.json(
      {
        error: `CSV has ${leadsToInsert.length} leads but only ${remaining} credits remain. Upgrade your plan or import a smaller file.`,
      },
      { status: 402 }
    );
  }

  // Create campaign
  const baseName = (fileName ?? "Imported leads").toString().replace(/\.csv$/i, "").trim() || "Imported leads";
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      user_id: user.id,
      name: `${baseName} (CSV import)`,
      tone: "Professional",
      status: "draft",
      lead_count: leadsToInsert.length,
    })
    .select()
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }

  // Insert leads
  const { error: insertError } = await supabase
    .from("leads")
    .insert(leadsToInsert.map((l) => ({ ...l, campaign_id: campaign.id })));

  if (insertError) {
    await supabase.from("campaigns").delete().eq("id", campaign.id).eq("user_id", user.id);
    return NextResponse.json({ error: "Failed to insert leads" }, { status: 500 });
  }

  // Increment credits
  await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        credits_used: creditsUsed + leadsToInsert.length,
        credits_limit: creditsLimit,
      },
      { onConflict: "user_id" }
    );

  return NextResponse.json({
    campaignId: campaign.id,
    imported: leadsToInsert.length,
    skipped,
  });
}
