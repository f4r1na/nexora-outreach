import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return Response.json({ profile: data ?? null });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    company_name?: string;
    company_description?: string;
    ideal_customer?: string;
    value_proposition?: string;
    tone?: string;
    website_url?: string;
    differentiators?: string;
  };

  const service = getServiceClient();
  const { error } = await service
    .from("company_profiles")
    .upsert(
      {
        user_id: user.id,
        company_name:        body.company_name        ?? null,
        company_description: body.company_description ?? null,
        ideal_customer:      body.ideal_customer      ?? null,
        value_proposition:   body.value_proposition   ?? null,
        tone:                body.tone                ?? "Professional",
        website_url:         body.website_url         ?? null,
        differentiators:     body.differentiators     ?? null,
        updated_at:          new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
