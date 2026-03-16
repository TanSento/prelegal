import { ChatMessage } from "./types";

function storageKey(docId: string): string {
  return `prelegal_chat_${docId}`;
}

export function loadMessages(docId: string): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(storageKey(docId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMessages(docId: string, messages: ChatMessage[]): void {
  sessionStorage.setItem(storageKey(docId), JSON.stringify(messages));
}

export function clearMessages(docId: string): void {
  sessionStorage.removeItem(storageKey(docId));
}
