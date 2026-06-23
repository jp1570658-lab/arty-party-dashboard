"use client";

import { backwardTimeline } from "@/lib/marketing";
import { formatDate } from "@/lib/utils";

export function CampaignCalendar({ eventDate }: { eventDate: string }) {
  const milestones = backwardTimeline(new Date(eventDate));
  const today = new Date();

  return (
    <div className="relative pl-5">
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-line" />
      <ul className="space-y-3">
        {milestones.map((m) => {
          const past = m.date < today;
          const isEvent = m.offset === 0;
          return (
            <li key={m.offset} className="relative">
              <span
                className={`absolute -left-5 top-1 h-3.5 w-3.5 rounded-full border-2 ${
                  isEvent
                    ? "border-brand-purple bg-brand-purple"
                    : past
                      ? "border-line-strong bg-line-strong"
                      : "border-brand-purple bg-surface-0"
                }`}
              />
              <div className="flex items-baseline justify-between gap-3">
                <span className={`text-sm ${isEvent ? "font-semibold text-brand-purple" : "text-ink-primary"}`}>
                  {m.label}
                </span>
                <span className="shrink-0 text-xs text-ink-muted">
                  {m.offset === 0 ? "" : `D-${m.offset} · `}
                  {formatDate(m.date)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
