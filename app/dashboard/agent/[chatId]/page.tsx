import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "../_components/ChatInterface";

interface Props {
  params: Promise<{ chatId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { chatId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <ChatInterface key={chatId} chatId={chatId} />;
}
