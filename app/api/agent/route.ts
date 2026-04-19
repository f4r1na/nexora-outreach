import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type StepEvent    = { type: "step";   message: string; icon: string };
type ResultEvent  = { type: "result"; data: AgentResult };
type ErrorEvent   = { type: "error";  message: string };
type DoneEvent    = { type: "done" };
type SSEEvent     = StepEvent | ResultEvent | ErrorEvent | DoneEvent;

type AgentResult = {
  intent: string;
  summary: string;
  items: ResultItem[];
  action?: { label: string; href: string };
};

type ResultItem = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  status?: string;
};

function encode(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json()) as { prompt?: string };
  const prompt = body.prompt?.trim();
  if (!prompt) return new Response("Bad Request", { status: 400 });

  const userId = user.id;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) =>
        controller.enqueue(new TextEncoder().encode(encode(event)));

      try {
        send({ type: "step", message: "Parsing your request...", icon: "brain" });

        const intentResp = await anthropic.messages.create({
          model: "claude-opus-4-7",
          max_tokens: 64,
          system: `You are an intent classifier for Nexora, an AI cold email outreach tool.
Classify the user's request into exactly one of: campaigns, analytics, inbox, followups, signals, draft, unknown.
Respond with ONLY the intent word.`,
          messages: [{ role: "user", content: prompt }],
        });

        const rawIntent = (intentResp.content[0] as { type: string; text: string }).text
          .trim()
          .toLowerCase();
        const validIntents = ["campaigns", "analytics", "inbox", "followups", "signals", "draft"];
        const intent = validIntents.includes(rawIntent) ? rawIntent : "unknown";

        send({ type: "step", message: `Intent: ${intent}`, icon: "zap" });
        send({ type: "step", message: "Fetching your data...", icon: "database" });

        let result: AgentResult;

        if (intent === "campaigns" || intent === "draft") {
          const { data: campaigns } = await supabase
            .from("campaigns")
            .select("id, name, status, lead_count, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(6);

          const count = campaigns?.length ?? 0;
          send({ type: "step", message: `Found ${count} campaign${count !== 1 ? "s" : ""}`, icon: "mail" });

          result = {
            intent,
            summary: intent === "draft"
              ? "Ready to create a new campaign. Here are your existing ones:"
              : "Here are your campaigns:",
            items: (campaigns ?? []).map((c) => ({
              id: c.id,
              title: c.name,
              subtitle: `${c.lead_count ?? 0} leads`,
              meta: new Date(c.created_at).toLocaleDateString(),
              status: c.status,
            })),
            action: intent === "draft"
              ? { label: "New Campaign", href: "/dashboard/campaigns/new" }
              : { label: "View all", href: "/dashboard/campaigns" },
          };
        } else if (intent === "inbox") {
          const { data: replies } = await supabase
            .from("replies")
            .select("id, lead_name, lead_email, subject, status, received_at")
            .eq("user_id", userId)
            .order("received_at", { ascending: false })
            .limit(6);

          const count = replies?.length ?? 0;
          send({ type: "step", message: `Found ${count} repl${count !== 1 ? "ies" : "y"} in inbox`, icon: "inbox" });

          result = {
            intent,
            summary: "Here are your recent inbox replies:",
            items: (replies ?? []).map((r) => ({
              id: r.id,
              title: r.lead_name ?? r.lead_email ?? "Unknown",
              subtitle: r.subject ?? "No subject",
              meta: r.received_at ? new Date(r.received_at).toLocaleDateString() : "",
              status: r.status,
            })),
            action: { label: "Open inbox", href: "/dashboard/inbox" },
          };
        } else if (intent === "analytics") {
          const { data: campaigns } = await supabase
            .from("campaigns")
            .select("id, name, lead_count, emails_sent, opens, clicks")
            .eq("user_id", userId)
            .order("emails_sent", { ascending: false })
            .limit(6);

          send({ type: "step", message: "Calculating performance metrics...", icon: "bar-chart" });

          result = {
            intent,
            summary: "Here is your campaign performance:",
            items: (campaigns ?? []).map((c) => {
              const sent = c.emails_sent ?? 0;
              const opens = c.opens ?? 0;
              const rate = sent > 0 ? Math.round((opens / sent) * 100) : 0;
              return {
                id: c.id,
                title: c.name,
                subtitle: `${sent} sent · ${opens} opens · ${c.clicks ?? 0} clicks`,
                meta: `${rate}% open rate`,
              };
            }),
            action: { label: "Full analytics", href: "/dashboard/analytics" },
          };
        } else if (intent === "followups") {
          const { data: followups } = await supabase
            .from("followup_sequences")
            .select("id, lead_name, lead_email, status, next_send_at")
            .eq("user_id", userId)
            .order("next_send_at", { ascending: true })
            .limit(6);

          const count = followups?.length ?? 0;
          send({ type: "step", message: `Found ${count} follow-up sequence${count !== 1 ? "s" : ""}`, icon: "repeat" });

          result = {
            intent,
            summary: "Here are your follow-up sequences:",
            items: (followups ?? []).map((f) => ({
              id: f.id,
              title: f.lead_name ?? f.lead_email ?? "Unknown",
              subtitle: f.status ?? "unknown",
              meta: f.next_send_at ? `Next: ${new Date(f.next_send_at).toLocaleDateString()}` : "",
              status: f.status,
            })),
            action: { label: "Manage follow-ups", href: "/dashboard/followups" },
          };
        } else if (intent === "signals") {
          const { data: signals } = await supabase
            .from("signals")
            .select("id, company, signal_type, summary, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(6);

          const count = signals?.length ?? 0;
          send({ type: "step", message: `Found ${count} lead research signal${count !== 1 ? "s" : ""}`, icon: "search" });

          result = {
            intent,
            summary: "Here are your lead research signals:",
            items: (signals ?? []).map((s) => ({
              id: s.id,
              title: s.company ?? "Unknown company",
              subtitle: (s.summary ?? s.signal_type) ?? "",
              meta: new Date(s.created_at).toLocaleDateString(),
            })),
            action: { label: "View signals", href: "/dashboard/signals" },
          };
        } else {
          result = {
            intent: "unknown",
            summary: "I can help with campaigns, inbox, analytics, follow-ups, and lead research. Try:",
            items: [
              { id: "1", title: "Show me my campaigns", subtitle: "View and manage your campaigns" },
              { id: "2", title: "Check my inbox", subtitle: "See recent replies" },
              { id: "3", title: "Show analytics", subtitle: "View campaign performance" },
              { id: "4", title: "Manage follow-ups", subtitle: "See scheduled follow-ups" },
            ],
          };
        }

        send({ type: "step", message: "Done", icon: "check" });
        send({ type: "result", data: result });
        send({ type: "done" });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Something went wrong",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
