"use client";

// Minimal placeholder — fully implemented in Phase 13.
import { X, Sparkles } from "lucide-react";
import { useUIStore } from "@/store/ui";

export function AIAssistant() {
  const aiOpen = useUIStore((s) => s.aiOpen);
  const setAiOpen = useUIStore((s) => s.setAiOpen);

  if (!aiOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => setAiOpen(false)}
      />
      <div className="relative h-full w-full max-w-md border-l bg-surface-0 shadow-xl">
        <div className="flex h-16 items-center justify-between border-b px-5">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-brand-purple" />
            AI Assistant
          </div>
          <button onClick={() => setAiOpen(false)} className="btn-ghost px-2 py-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 text-sm text-ink-secondary">
          The assistant arrives in Phase 13.
        </div>
      </div>
    </div>
  );
}
