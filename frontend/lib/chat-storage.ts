import { ChatMessage } from "./types";

const KEY = "prelegal_chat_nda";

export function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  sessionStorage.setItem(KEY, JSON.stringify(messages));
}

export function clearMessages(): void {
  sessionStorage.removeItem(KEY);
}
