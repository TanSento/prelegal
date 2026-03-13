import { ChatMessage, GenericFormData, NdaFormData } from "./types";

interface StreamCallbacks {
  onToken: (text: string) => void;
  onFields: (fields: Partial<NdaFormData> | { fields: Record<string, string> } | { docType: string }) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function streamChat(
  messages: ChatMessage[],
  formData: NdaFormData | GenericFormData,
  callbacks: StreamCallbacks,
  docType: string | null,
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

  let doneEmitted = false;

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
        else if (event === "done") { doneEmitted = true; callbacks.onDone(); }
        else if (event === "error") callbacks.onError(data.message);
      }
    }
    if (!doneEmitted) callbacks.onDone();
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      callbacks.onError(err?.message ?? "Stream read failed");
    }
    // AbortError: silently return — caller handles cleanup
  }
}

/** Deep-merge partial NDA fields into current form data. */
export function mergeFields(current: NdaFormData, incoming: Partial<NdaFormData>): NdaFormData {
  const result = { ...current };
  for (const key of Object.keys(incoming) as (keyof NdaFormData)[]) {
    const val = incoming[key];
    if (val === null || val === undefined) continue;
    if (typeof val === "object" && !Array.isArray(val)) {
      (result as any)[key] = { ...(current as any)[key], ...val };
    } else {
      (result as any)[key] = val;
    }
  }
  return result;
}

/** Merge generic fields into current generic form data. */
export function mergeGenericFields(
  current: GenericFormData,
  incoming: Record<string, string>
): GenericFormData {
  return { ...current, fields: { ...current.fields, ...incoming } };
}
