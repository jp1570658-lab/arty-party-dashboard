import { cn } from "@/lib/utils";
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_STYLES,
  type EventStatus,
} from "@/lib/enums";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const s = status as EventStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        EVENT_STATUS_STYLES[s] ?? "bg-surface-2 text-ink-secondary",
        className
      )}
    >
      {EVENT_STATUS_LABELS[s] ?? status}
    </span>
  );
}
