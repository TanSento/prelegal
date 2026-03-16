import { ChatMessage } from "./types";
import { DocFormData } from "./doc-schema";

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
    headers: { "Content-Type": "application/json" },
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
