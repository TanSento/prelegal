import { ChatMessage } from "./types";

const KEY = "prelegal_chat_nda";

export function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  localStorage.setItem(KEY, JSON.stringify(messages));
}

export function clearMessages(): void {
  localStorage.removeItem(KEY);
}
