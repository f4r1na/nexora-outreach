import { ChatEntry, ChatIndexEntry, ChatMessage } from './types';

const CHAT_PREFIX = 'nexora_chat_';
const INDEX_KEY = 'nexora_chat_index';
const MAX_CHATS = 20;

export function loadChat(chatId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${CHAT_PREFIX}${chatId}`);
    if (!raw) return [];
    const entry: ChatEntry = JSON.parse(raw);
    return entry.messages ?? [];
  } catch {
    return [];
  }
}

export function saveChat(chatId: string, messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  const index = loadIndex();
  const existing = index.find((e) => e.id === chatId);
  const firstUserMsg = messages.find((m) => m.role === 'user');
  const title = firstUserMsg ? firstUserMsg.content.slice(0, 60) : 'New chat';
  const createdAt = existing?.createdAt ?? new Date().toISOString();

  const entry: ChatEntry = { id: chatId, title, createdAt, messages };
  localStorage.setItem(`${CHAT_PREFIX}${chatId}`, JSON.stringify(entry));
  _updateIndex({ id: chatId, title, createdAt });
}

export function loadIndex(): ChatIndexEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatIndexEntry[];
  } catch {
    return [];
  }
}

export function deleteChat(chatId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${CHAT_PREFIX}${chatId}`);
  const updated = loadIndex().filter((e) => e.id !== chatId);
  localStorage.setItem(INDEX_KEY, JSON.stringify(updated));
}

function _updateIndex(entry: ChatIndexEntry): void {
  const filtered = loadIndex().filter((e) => e.id !== entry.id);
  const updated = [entry, ...filtered].slice(0, MAX_CHATS);
  localStorage.setItem(INDEX_KEY, JSON.stringify(updated));
}
