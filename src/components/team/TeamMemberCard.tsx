"use client";

import { Mail, Phone, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEAM_STATUS_LABELS, TEAM_STATUS_STYLES } from "@/lib/enums";

export interface TeamMemberItem {
  id: string;
  role: string;
  teamType: string;
  status: string;
  notes: string | null;
  teamMember: { id: string; name: string; email: string | null; phone: string | null } | null;
  artist: { id: string; name: string; category: string } | null;
}

const CYCLE = ["not_asked", "tentative", "confirmed"];

export function TeamMemberCard({
  member,
  onCycleStatus,
  onRemove,
}: {
  member: TeamMemberItem;
  onCycleStatus: (next: string) => void;
  onRemove: () => void;
}) {
  const name = member.teamMember?.name ?? member.artist?.name ?? "Unknown";
  const email = member.teamMember?.email;
  const phone = member.teamMember?.phone;
  const status = member.status === "pending" ? "not_asked" : member.status;

  function cycle() {
    const i = CYCLE.indexOf(status);
    onCycleStatus(CYCLE[(i + 1) % CYCLE.length]);
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-surface-0 p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink-primary">{name}</span>
          {member.artist && (
            <span className="rounded bg-brand-purple-light px-1.5 py-0.5 text-[10px] font-medium text-brand-purple">
              Artist
            </span>
          )}
        </div>
        <div className="text-xs text-ink-secondary">{member.role}</div>
        {(email || phone) && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-muted">
            {email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {email}
              </span>
            )}
            {phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {phone}
              </span>
            )}
          </div>
        )}
        {member.notes && (
          <div className="mt-1 text-xs text-ink-secondary">{member.notes}</div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={cycle}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
            TEAM_STATUS_STYLES[status]
          )}
          title="Click to change status"
        >
          {TEAM_STATUS_LABELS[status]}
        </button>
        <button
          onClick={onRemove}
          className="text-ink-muted transition-colors hover:text-danger"
          aria-label="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
