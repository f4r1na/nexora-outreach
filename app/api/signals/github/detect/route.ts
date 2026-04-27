import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const gh = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s?#]+)/);
  if (gh) return { owner: gh[1], repo: gh[2] };
  const plain = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (plain) return { owner: plain[1], repo: plain[2] };
  return null;
}

function getMajorVersion(version: string): number | null {
  const clean = version.replace(/^[\^~>=<*\s]+/, "").trim();
  const match = clean.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

type DepsMap = Record<string, string>;

function extractDeps(pkg: Record<string, unknown>): DepsMap {
  return {
    ...(pkg.dependencies as DepsMap ?? {}),
    ...(pkg.devDependencies as DepsMap ?? {}),
  };
}

type Change = { package: string; from: number; to: number };

function detectMajorUpgrades(oldDeps: DepsMap, newDeps: DepsMap): Change[] {
  const changes: Change[] = [];
  for (const [pkg, newVer] of Object.entries(newDeps)) {
    const newMajor = getMajorVersion(newVer);
    if (newMajor === null) continue;
    const oldVer = oldDeps[pkg];
    if (!oldVer) continue;
    const oldMajor = getMajorVersion(oldVer);
    if (oldMajor === null || newMajor <= oldMajor) continue;
    changes.push({ package: pkg, from: oldMajor, to: newMajor });
  }
  return changes;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { lead_id, repo_url } = body as { lead_id?: string; repo_url?: string };

    if (!lead_id || !repo_url) {
      return NextResponse.json({ error: "lead_id and repo_url required" }, { status: 400 });
    }

    const db = getDb();

    // Ownership check: lead must belong to user's campaign
    const { data: lead } = await db
      .from("leads")
      .select("id, campaign_id")
      .eq("id", lead_id)
      .single();
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const { data: camp } = await db
      .from("campaigns")
      .select("id")
      .eq("id", lead.campaign_id)
      .eq("user_id", user.id)
      .single();
    if (!camp) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const parsed = parseRepoUrl(repo_url);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid GitHub repo URL" }, { status: 400 });
    }
    const { owner, repo } = parsed;
    const normalizedUrl = `https://github.com/${owner}/${repo}`;

    // Fetch current package.json from GitHub CDN (no auth, public repos only)
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/package.json`;
    const ghRes = await fetch(rawUrl);
    if (!ghRes.ok) {
      return NextResponse.json(
        { error: `Cannot fetch package.json from ${normalizedUrl}. Is this a public repo with a package.json at the root?` },
        { status: 422 }
      );
    }

    let currentPkg: Record<string, unknown>;
    try {
      currentPkg = await ghRes.json();
    } catch {
      return NextResponse.json({ error: "package.json is not valid JSON" }, { status: 422 });
    }

    // Load cached version
    const { data: cached } = await db
      .from("github_repos")
      .select("last_package_json")
      .eq("repo_url", normalizedUrl)
      .maybeSingle();

    const today = new Date().toISOString().slice(0, 10);
    const packageUrl = `https://github.com/${owner}/${repo}/blob/HEAD/package.json`;

    type NewSignal = {
      id: string;
      text: string;
      source: string;
      source_url: string | null;
      date: string;
      date_iso: string;
      strength: string;
      type: string;
    };
    const newSignals: NewSignal[] = [];

    if (cached?.last_package_json) {
      const oldDeps = extractDeps(cached.last_package_json as Record<string, unknown>);
      const newDeps = extractDeps(currentPkg);
      const changes = detectMajorUpgrades(oldDeps, newDeps);

      for (const change of changes) {
        const text = `Team upgraded ${change.package} from v${change.from} to v${change.to}`;

        // Deduplicate: skip if this exact signal already exists for this lead
        const { data: existing } = await db
          .from("signals")
          .select("id")
          .eq("lead_id", lead_id)
          .eq("source", "GitHub")
          .eq("text", text)
          .maybeSingle();

        if (!existing) {
          const { data: inserted } = await db
            .from("signals")
            .insert({
              lead_id,
              campaign_id: lead.campaign_id,
              source: "GitHub",
              source_url: packageUrl,
              date: today,
              date_iso: today,
              strength: "high",
              type: "tech_upgrade",
              text,
              discarded: false,
            })
            .select("id, text, source, source_url, date, date_iso, strength, type")
            .single();

          if (inserted) newSignals.push(inserted as NewSignal);
        }
      }
    }

    // Upsert cache with current package.json
    await db
      .from("github_repos")
      .upsert(
        {
          repo_url: normalizedUrl,
          owner,
          repo,
          last_package_json: currentPkg,
          last_checked_at: new Date().toISOString(),
        },
        { onConflict: "repo_url" }
      );

    const firstCheck = !cached;
    const message = firstCheck
      ? "Repository cached. Check again after the team pushes updates to detect upgrades."
      : newSignals.length > 0
        ? `Found ${newSignals.length} major upgrade${newSignals.length > 1 ? "s" : ""}`
        : "No major version changes since last check";

    return NextResponse.json({ signals: newSignals, message, first_check: firstCheck });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
