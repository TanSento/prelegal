"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage, NdaFormData } from "@/lib/types";
import { loadMessages, saveMessages } from "@/lib/chat-storage";
import { mergeFields, streamChat } from "@/lib/api";

const GREETING = "Hi! I'm your NDA assistant. I'll help you fill in the Mutual Non-Disclosure Agreement through conversation. Let's start — what's the purpose of sharing confidential information between the two parties?";

interface ChatPanelProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
  onDownload: () => void;
  downloading: boolean;
}

export default function ChatPanel({ data, onChange, onDownload, downloading }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const dataRef = useRef(data);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const saved = loadMessages();
    if (saved.length === 0) {
      const greeting: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: GREETING };
      setMessages([greeting]);
      saveMessages([greeting]);
    } else {
      setMessages(saved);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    saveMessages(nextMessages);
    setInput("");
    setStreaming(true);
    setStreamingText("");
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = "";
    // Send last 10 messages as history
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
            onChange(mergeFields(dataRef.current, fields));
          },
          onDone: () => {
            const assistantMsg: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: accumulated.trim(),
            };
            const finalMessages = [...nextMessages, assistantMsg];
            setMessages(finalMessages);
            saveMessages(finalMessages);
            setStreamingText("");
            setStreaming(false);
          },
          onError: (msg) => {
            setError(msg);
            setStreamingText("");
            setStreaming(false);
          },
        },
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-slate-800">Mutual NDA Assistant</h2>
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

        <button
          onClick={onDownload}
          disabled={downloading}
          className="w-full rounded-lg bg-[#753991] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#632d7a] active:bg-[#512469] transition focus:outline-none focus:ring-2 focus:ring-[#753991] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloading ? "Generating PDF…" : "Download as PDF"}
        </button>
      </div>
    </div>
  );
}
