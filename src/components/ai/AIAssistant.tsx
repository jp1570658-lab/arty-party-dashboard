"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, Send, Loader2, ListChecks, BarChart3, Lightbulb } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { AISuggestionCard, type ChatMessage } from "./AISuggestionCard";

const QUICK_ACTIONS = [
  { label: "What am I missing?", icon: ListChecks, prompt: "Look at the current event and tell me what sections or details are missing or incomplete, in priority order." },
  { label: "Analyse this event", icon: BarChart3, prompt: "Analyse the current event compared to my past events. What stands out, and what should I watch out for?" },
  { label: "Ideas for next time", icon: Lightbulb, prompt: "Based on lessons from past events, suggest 3 concrete ideas to make this event better." },
];

export function AIAssistant() {
  const aiOpen = useUIStore((s) => s.aiOpen);
  const setAiOpen = useUIStore((s) => s.setAiOpen);
  const activeEvent = useUIStore((s) => s.activeEvent);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: activeEvent?.id, message: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: err instanceof Error ? err.message : "Something went wrong" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={() => setAiOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative flex h-full w-full max-w-md flex-col border-l bg-surface-0 shadow-xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-purple" />
                <div>
                  <div className="font-semibold text-ink-primary">AI Assistant</div>
                  {activeEvent && (
                    <div className="text-[11px] text-ink-muted">{activeEvent.name}</div>
                  )}
                </div>
              </div>
              <button onClick={() => setAiOpen(false)} className="btn-ghost px-2 py-2" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-ink-secondary">
                    {activeEvent
                      ? `Ask anything about "${activeEvent.name}", or try a quick action:`
                      : "Open an event to get tailored suggestions, or ask a general question."}
                  </p>
                  <div className="space-y-2">
                    {QUICK_ACTIONS.map((a) => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={a.label}
                          onClick={() => send(a.prompt)}
                          className="flex w-full items-center gap-2.5 rounded-lg border bg-surface-0 px-3 py-2.5 text-left text-sm font-medium text-ink-primary transition-colors hover:bg-surface-2"
                        >
                          <Icon className="h-4 w-4 text-brand-purple" />
                          {a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <AISuggestionCard key={i} message={m} />
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              )}
            </div>

            <div className="shrink-0 border-t p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder="Ask the assistant…"
                  className="input max-h-32 min-h-[40px] resize-none"
                />
                <button
                  onClick={() => send(input)}
                  disabled={loading || !input.trim()}
                  className="btn-primary px-3 py-2.5"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
