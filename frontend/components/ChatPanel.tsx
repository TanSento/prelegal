"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage, GenericFormData, NdaFormData } from "@/lib/types";
import { loadMessages, saveMessages } from "@/lib/chat-storage";
import { mergeFields, mergeGenericFields, streamChat } from "@/lib/api";

const DOC_NAMES: Record<string, string> = {
  nda: "Mutual NDA Assistant",
  csa: "Cloud Service Agreement Assistant",
  sla: "Service Level Agreement Assistant",
  psa: "Professional Services Agreement Assistant",
  dpa: "Data Processing Agreement Assistant",
  "design-partner": "Design Partner Agreement Assistant",
  partnership: "Partnership Agreement Assistant",
  "software-license": "Software License Agreement Assistant",
  pilot: "Pilot Agreement Assistant",
  baa: "Business Associate Agreement Assistant",
  "ai-addendum": "AI Addendum Assistant",
};

const SELECTION_GREETING =
  "Hi! I'm your legal document assistant. What kind of document do you need today? For example: a Mutual NDA, a Cloud Service Agreement, a Pilot Agreement, or any of our other supported templates.";

const DOC_GREETINGS: Record<string, string> = {
  nda: "Great! Let's fill in your Mutual NDA. What's the purpose of sharing confidential information between the two parties? (e.g. 'Evaluating a potential acquisition')",
  csa: "Let's set up your Cloud Service Agreement. What is the name of the service provider company? (e.g. 'Acme Technologies Inc.')",
  sla: "Let's set up your Service Level Agreement. What is the target uptime percentage? (e.g. '99.9%')",
  psa: "Let's set up your Professional Services Agreement. What is the name of the service provider? (e.g. 'Consulting Partners LLC')",
  dpa: "Let's set up your Data Processing Agreement. What is the name of the data processor — the company that will process the data? (e.g. 'DataTech Inc.')",
  "design-partner": "Let's set up your Design Partner Agreement. What is the name of the company offering the product? (e.g. 'StartupAI Inc.')",
  partnership: "Let's set up your Partnership Agreement. What is the name of the first company? (e.g. 'Alpha Technologies LLC')",
  "software-license": "Let's set up your Software License Agreement. What is the name of the software provider? (e.g. 'TechCorp Inc.')",
  pilot: "Let's set up your Pilot Agreement. What is the name of the company offering the pilot? (e.g. 'NovaSaaS Inc.')",
  baa: "Let's set up your Business Associate Agreement. What is the name of the business associate — the company handling protected health information? (e.g. 'HealthTech LLC')",
  "ai-addendum": "Let's set up your AI Addendum. What is the name of the AI service provider? (e.g. 'AIVendor Corp')",
};

interface ChatPanelProps {
  data: NdaFormData | GenericFormData;
  docType: string | null;
  onChange: (data: NdaFormData | GenericFormData) => void;
  onDocTypeChange: (docType: string) => void;
  onDownload: () => void;
  downloading: boolean;
}

export default function ChatPanel({
  data,
  docType,
  onChange,
  onDocTypeChange,
  onDownload,
  downloading,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const dataRef = useRef(data);
  const streamingRef = useRef(false);
  const docTypeRef = useRef(docType);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  useEffect(() => {
    docTypeRef.current = docType;
  }, [docType]);

  // Load messages when docType changes
  useEffect(() => {
    if (streamingRef.current) return;
    const saved = loadMessages(docType);
    if (saved.length === 0) {
      const greetingText =
        docType === null
          ? SELECTION_GREETING
          : DOC_GREETINGS[docType] ?? `Let's fill in your ${DOC_NAMES[docType] ?? "document"}. How can I help?`;
      const greeting: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: greetingText,
      };
      setMessages([greeting]);
      saveMessages(docType, [greeting]);
    } else {
      setMessages(saved);
    }
  }, [docType]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    saveMessages(docType, nextMessages);
    setInput("");
    inputRef.current?.focus();
    setStreaming(true);
    setStreamingText("");
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = "";
    const history = nextMessages.slice(-10);

    try {
      await streamChat(
        history,
        data,
        {
          onToken: (token) => {
            accumulated += token;
            setStreamingText(accumulated);
          },
          onFields: (fields) => {
            if ("docType" in fields && typeof fields.docType === "string") {
              onDocTypeChange(fields.docType);
            } else if ("fields" in fields && typeof fields.fields === "object") {
              onChange(mergeGenericFields(dataRef.current as GenericFormData, fields.fields as Record<string, string>));
            } else {
              onChange(mergeFields(dataRef.current as NdaFormData, fields as Partial<NdaFormData>));
            }
          },
          onDone: () => {
            const assistantMsg: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: accumulated.trim(),
            };
            const finalMessages = [...nextMessages, assistantMsg];
            setMessages(finalMessages);
            saveMessages(docTypeRef.current, finalMessages);
            setStreamingText("");
            setStreaming(false);
            inputRef.current?.focus();
          },
          onError: (msg) => {
            setError(msg);
            setStreamingText("");
            setStreaming(false);
          },
        },
        docType,
        controller.signal
      );
    } catch {
      setStreaming(false);
      setStreamingText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const headerTitle = docType ? (DOC_NAMES[docType] ?? "Document Assistant") : "Legal Document Assistant";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-slate-800">{headerTitle}</h2>
        <p className="text-xs text-slate-500 mt-0.5">Chat to fill in your document — the preview updates live</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#209dd7] text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-800 rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* In-progress streaming bubble */}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed bg-slate-100 text-slate-800 whitespace-pre-wrap">
              {streamingText}
              <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-slate-400 animate-pulse align-middle" />
            </div>
          </div>
        )}

        {/* Typing indicator when waiting for first token */}
        {streaming && !streamingText && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-slate-100">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 text-center px-4">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pt-3 pb-3 border-t border-slate-200 bg-white">
        <div className="flex gap-2 mb-3">
          <textarea
            ref={inputRef}
            rows={2}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#209dd7] focus:border-transparent resize-none transition"
            placeholder="Type a message… (Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="self-end rounded-xl bg-[#753991] px-4 py-2 text-sm font-semibold text-white hover:bg-[#632d7a] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        {docType && (
          <button
            onClick={onDownload}
            disabled={downloading}
            className="w-full rounded-lg bg-[#753991] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#632d7a] active:bg-[#512469] transition focus:outline-none focus:ring-2 focus:ring-[#753991] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading ? "Generating PDF…" : "Download as PDF"}
          </button>
        )}
      </div>
    </div>
  );
}
