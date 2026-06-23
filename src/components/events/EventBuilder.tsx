"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brush,
  Users,
  Truck,
  ListOrdered,
  CalendarClock,
  Handshake,
  UserCheck,
  Megaphone,
  Wallet,
  Images,
  ClipboardCheck,
  MapPin,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useUIStore } from "@/store/ui";
import { StatusBadge } from "./StatusBadge";
import { EditEventForm } from "./EditEventForm";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Button, Select } from "@/components/ui/primitives";
import {
  CollapsibleSection,
  SectionPlaceholder,
} from "@/components/builder/CollapsibleSection";
import { ActivitiesSection } from "@/components/builder/ActivitiesSection";
import type { ActivityRef } from "@/components/builder/activity-types";
import { EVENT_STATUSES, EVENT_STATUS_LABELS, type EventStatus } from "@/lib/enums";
import { computeProgress } from "@/lib/progress";
import { formatDate, formatTime } from "@/lib/utils";
import type { FullEvent } from "@/lib/event-include";

export function EventBuilder({
  event,
  allActivities,
}: {
  event: FullEvent;
  allActivities: ActivityRef[];
}) {
  const router = useRouter();
  const setActiveEvent = useUIStore((s) => s.setActiveEvent);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(event.status);

  useEffect(() => {
    setActiveEvent({ id: event.id, name: event.name });
  }, [event.id, event.name, setActiveEvent]);

  const progress = computeProgress({
    activities: event.activities.length > 0,
    team: event.teamMembers.length > 0,
    logistics: event.logistics.length > 0,
    runOfShow: event.runOfShow.length > 0,
    budget: (event.budget?.items.length ?? 0) > 0,
    marketing: !!event.marketingPlan,
    media: event.mediaFiles.length > 0,
    postAnalysis: !!event.postAnalysis,
  });

  async function changeStatus(next: string) {
    setStatus(next);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Status → ${EVENT_STATUS_LABELS[next as EventStatus]}`);
      router.refresh();
    } catch {
      toast.error("Failed to update status");
      setStatus(event.status);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setActiveEvent(null);
      toast.success("Event deleted");
      router.push("/events");
    } catch {
      toast.error("Failed to delete event");
    }
  }

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <StatusBadge status={status} />
              {event.theme && (
                <span className="text-xs text-ink-muted">· {event.theme}</span>
              )}
            </div>
            <h1 className="truncate text-2xl font-semibold text-ink-primary">
              {event.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-ink-muted" />
                {formatDate(event.date)}
                {event.buildUpTime && ` · build-up ${formatTime(event.buildUpTime)}`}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-ink-muted" />
                {event.location}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center">
              <ProgressRing value={progress} size={56} stroke={5} />
              <div className="mt-1 text-[10px] uppercase tracking-wide text-ink-muted">
                Built
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
          <Select
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            className="w-auto"
          >
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {EVENT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit details
          </Button>
          <Button variant="ghost" onClick={remove} className="text-danger">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Feature sections */}
      <CollapsibleSection title="Activities & Materials" icon={Brush} defaultOpen summary={`${event.activities.length} activities`}>
        <ActivitiesSection
          eventId={event.id}
          allActivities={allActivities}
          initial={event.activities}
        />
      </CollapsibleSection>
      <CollapsibleSection title="Team" icon={Users} summary={`${event.teamMembers.length} people`}>
        <SectionPlaceholder phase="Phase 4" />
      </CollapsibleSection>
      <CollapsibleSection title="Logistics" icon={Truck} summary={`${event.logistics.length} tasks`}>
        <SectionPlaceholder phase="Phase 5" />
      </CollapsibleSection>
      <CollapsibleSection title="Run of Show" icon={ListOrdered} summary={`${event.runOfShow.length} items`}>
        <SectionPlaceholder phase="Phase 5" />
      </CollapsibleSection>
      <CollapsibleSection title="Meetings" icon={CalendarClock} summary={`${event.meetings.length} meetings`}>
        <SectionPlaceholder phase="Phase 7" />
      </CollapsibleSection>
      <CollapsibleSection title="Partners" icon={Handshake} summary={`${event.partners.length} partners`}>
        <SectionPlaceholder phase="Phase 8" />
      </CollapsibleSection>
      <CollapsibleSection title="Guests" icon={UserCheck} summary={`${event.guestInvites.length} invites`}>
        <SectionPlaceholder phase="Phase 8" />
      </CollapsibleSection>
      <CollapsibleSection title="Marketing" icon={Megaphone}>
        <SectionPlaceholder phase="Phase 9" />
      </CollapsibleSection>
      <CollapsibleSection title="Budget" icon={Wallet} summary={`${event.budget?.items.length ?? 0} line items`}>
        <SectionPlaceholder phase="Phase 10" />
      </CollapsibleSection>
      <CollapsibleSection title="Media Vault" icon={Images} summary={`${event.mediaFiles.length} files`}>
        <SectionPlaceholder phase="Phase 11" />
      </CollapsibleSection>
      <CollapsibleSection title="Post-Event Analysis" icon={ClipboardCheck}>
        <SectionPlaceholder phase="Phase 12" />
      </CollapsibleSection>

      <EditEventForm event={event} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
