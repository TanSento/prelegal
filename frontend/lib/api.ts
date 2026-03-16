import { ChatMessage } from "./types";
import { DocFormData } from "./doc-schema";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("prelegal_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// --- Auth ---

export async function signup(name: string, email: string, password: string) {
  const resp = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: "Signup failed" }));
    throw new Error(err.detail || `Error ${resp.status}`);
  }
  return resp.json() as Promise<{ token: string; user: { id: number; name: string; email: string } }>;
}

export async function signin(email: string, password: string) {
  const resp = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: "Invalid credentials" }));
    throw new Error(err.detail || `Error ${resp.status}`);
  }
  return resp.json() as Promise<{ token: string; user: { id: number; name: string; email: string } }>;
}

export async function signout() {
  await fetch("/api/auth/signout", {
    method: "POST",
    headers: { ...authHeaders() },
  });
}

// --- Documents ---

export interface SavedDoc {
  id: number;
  doc_type: string;
  title: string;
  updated_at: string;
}

export interface FullDoc extends SavedDoc {
  form_data: Record<string, unknown>;
  chat_history: ChatMessage[];
  created_at: string;
}

export async function listDocuments(): Promise<SavedDoc[]> {
  const resp = await fetch("/api/documents", { headers: authHeaders() });
  if (!resp.ok) return [];
  return resp.json();
}

export async function getDocument(id: number): Promise<FullDoc> {
  const resp = await fetch(`/api/documents/${id}`, { headers: authHeaders() });
  if (!resp.ok) throw new Error("Failed to load document");
  return resp.json();
}

export async function saveDocument(
  docType: string,
  title: string,
  formData: DocFormData,
  chatHistory: ChatMessage[],
): Promise<{ id: number }> {
  const resp = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ doc_type: docType, title, form_data: formData, chat_history: chatHistory }),
  });
  if (!resp.ok) throw new Error("Failed to save document");
  return resp.json();
}

export async function updateDocument(
  id: number,
  updates: { title?: string; form_data?: DocFormData; chat_history?: ChatMessage[] },
): Promise<void> {
  const resp = await fetch(`/api/documents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(updates),
  });
  if (!resp.ok) throw new Error("Failed to update document");
}

// --- Chat streaming ---

interface StreamCallbacks {
  onToken: (text: string) => void;
  onFields: (fields: Record<string, unknown>) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function streamChat(
  messages: ChatMessage[],
  formData: DocFormData,
  docType: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ messages, formData, docType }),
    signal,
  });

  if (!resp.ok) {
    callbacks.onError(`Server error: ${resp.status}`);
    return;
  }

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const lines = part.split("\n");
        const eventLine = lines.find((l) => l.startsWith("event:"));
        const dataLine = lines.find((l) => l.startsWith("data:"));
        if (!eventLine || !dataLine) continue;

        const event = eventLine.slice("event:".length).trim();
        let data: any;
        try {
          data = JSON.parse(dataLine.slice("data:".length).trim());
        } catch {
          continue;
        }

        if (event === "token") callbacks.onToken(data.text);
        else if (event === "fields") callbacks.onFields(data);
        else if (event === "done") callbacks.onDone();
        else if (event === "error") callbacks.onError(data.message);
      }
    }
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      callbacks.onError(err?.message ?? "Stream read failed");
    }
  }
}

/** Deep-merge partial fields into current form data. */
export function mergeFields(current: DocFormData, incoming: Record<string, unknown>): DocFormData {
  const result = { ...current };

  for (const key of Object.keys(incoming)) {
    const val = incoming[key];
    if (val === null || val === undefined) continue;

    // Handle party1/party2 -> parties array mapping
    if (key === "party1" && typeof val === "object") {
      const parties = [...(result.parties as any[] || [])];
      parties[0] = { ...(parties[0] || {}), ...val };
      result.parties = parties;
      continue;
    }
    if (key === "party2" && typeof val === "object") {
      const parties = [...(result.parties as any[] || [])];
      parties[1] = { ...(parties[1] || {}), ...val };
      result.parties = parties;
      continue;
    }

    if (typeof val === "object" && !Array.isArray(val)) {
      (result as any)[key] = { ...(current as any)[key], ...val };
    } else {
      (result as any)[key] = val;
    }
  }
  return result;
}
