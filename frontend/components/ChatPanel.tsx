"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/lib/types";
import { DocSchema, DocFormData } from "@/lib/doc-schema";
import { loadMessages, saveMessages } from "@/lib/chat-storage";
import { mergeFields, streamChat } from "@/lib/api";

interface ChatPanelProps {
  schema: DocSchema;
  data: DocFormData;
  onChange: (data: DocFormData) => void;
  onDownload: () => void;
  downloading: boolean;
  onSave?: (messages: ChatMessage[]) => void;
  saving?: boolean;
  initialMessages?: ChatMessage[];
}

export default function ChatPanel({ schema, data, onChange, onDownload, downloading, onSave, saving, initialMessages }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const dataRef = useRef(data);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      messagesRef.current = initialMessages;
      return;
    }
    const saved = loadMessages(schema.id);
    if (saved.length === 0) {
      const greeting: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: schema.greeting };
      setMessages([greeting]);
      saveMessages(schema.id, [greeting]);
      messagesRef.current = [greeting];
    } else {
      setMessages(saved);
      messagesRef.current = saved;
    }
  }, [schema.id, schema.greeting, initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Auto-focus input after streaming completes
  useEffect(() => {
    if (!streaming) {
      inputRef.current?.focus();
    }
  }, [streaming]);

  const updateMessages = (msgs: ChatMessage[]) => {
    setMessages(msgs);
    messagesRef.current = msgs;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    updateMessages(nextMessages);
    saveMessages(schema.id, nextMessages);
    setInput("");
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
        schema.id,
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
            updateMessages(finalMessages);
            saveMessages(schema.id, finalMessages);
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
        <h2 className="text-lg font-semibold text-slate-800">{schema.title} Assistant</h2>
        <p className="text-xs text-slate-500 mt-0.5">Chat to fill in your document -- the preview updates live</p>
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
            placeholder="Type a message... (Enter to send)"
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

        <div className="flex gap-2">
          {onSave && (
            <button
              onClick={() => onSave(messagesRef.current)}
              disabled={saving || streaming}
              className="flex-1 rounded-lg bg-[#209dd7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a8abf] active:bg-[#177aaa] transition focus:outline-none focus:ring-2 focus:ring-[#209dd7] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Document"}
            </button>
          )}
          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex-1 rounded-lg bg-[#753991] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#632d7a] active:bg-[#512469] transition focus:outline-none focus:ring-2 focus:ring-[#753991] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading ? "Generating PDF..." : "Download as PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
