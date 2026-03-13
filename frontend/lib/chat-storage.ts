import { ChatMessage } from "./types";

function key(docType: string | null): string {
  return `prelegal_chat_${docType ?? "pending"}`;
}

export function loadMessages(docType: string | null): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(key(docType));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMessages(docType: string | null, messages: ChatMessage[]): void {
  sessionStorage.setItem(key(docType), JSON.stringify(messages));
}

export function clearMessages(docType: string | null): void {
  sessionStorage.removeItem(key(docType));
}
