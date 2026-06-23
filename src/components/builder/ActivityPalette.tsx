"use client";

import { Check, Loader2 } from "lucide-react";
import { activityIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import type { ActivityRef } from "./activity-types";

export function ActivityPalette({
  activities,
  activeIds,
  pendingId,
  onToggle,
}: {
  activities: ActivityRef[];
  activeIds: Set<string>;
  pendingId: string | null;
  onToggle: (activityId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
      {activities.map((a) => {
        const active = activeIds.has(a.id);
        const pending = pendingId === a.id;
        const Icon = activityIcon(a.icon);
        return (
          <button
            key={a.id}
            onClick={() => onToggle(a.id)}
            disabled={pending}
            className={cn(
              "relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all",
              active
                ? "border-brand-purple bg-brand-purple-light"
                : "border-line hover:border-line-strong"
            )}
          >
            {active && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-purple text-white">
                <Check className="h-3 w-3" />
              </span>
            )}
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: a.color }}
            >
              {pending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </span>
            <span
              className={cn(
                "text-xs font-medium leading-tight",
                active ? "text-brand-purple" : "text-ink-secondary"
              )}
            >
              {a.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
