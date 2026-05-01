export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatEntry {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface ChatIndexEntry {
  id: string;
  title: string;
  createdAt: string;
}

export interface ActiveCampaign {
  id: string;
  name: string;
  lead_count: number;
  emails_sent: number;
  status: string;
}
