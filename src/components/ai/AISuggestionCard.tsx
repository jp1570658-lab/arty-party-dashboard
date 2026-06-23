"use client";

import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AISuggestionCard({ message }: { message: ChatMessage }) {
  const isAI = message.role === "assistant";
  return (
    <div className={cn("flex gap-2.5", !isAI && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isAI ? "bg-brand-purple-light text-brand-purple" : "bg-surface-2 text-ink-secondary"
        )}
      >
        {isAI ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-sm",
          isAI
            ? "bg-surface-2 text-ink-primary"
            : "bg-brand-purple text-white"
        )}
      >
        <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
      </div>
    </div>
  );
}
