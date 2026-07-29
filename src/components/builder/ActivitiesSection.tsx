"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ActivityPalette } from "./ActivityPalette";
import { ActivityChecklist } from "./ActivityChecklist";
import { ArtistRegister, type ArtistOption, type LineupMember } from "./ArtistRegister";
import type { ActivityRef, EventActivityItem } from "./activity-types";

export function ActivitiesSection({
  eventId,
  eventName,
  allActivities,
  initial,
  lineup,
  allArtists,
  submittedKeys,
}: {
  eventId: string;
  eventName: string;
  allActivities: ActivityRef[];
  initial: EventActivityItem[];
  lineup: LineupMember[];
  allArtists: ArtistOption[];
  submittedKeys: string[];
}) {
  const router = useRouter();
  const [acts, setActs] = useState<EventActivityItem[]>(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const activeIds = useMemo(
    () => new Set(acts.map((a) => a.activityId)),
    [acts]
  );

  async function toggleActivity(activityId: string) {
    const existing = acts.find((a) => a.activityId === activityId);
    if (existing) {
      const edited =
        existing.materials.some((m) => m.checked) ||
        (existing.notes && existing.notes.length > 0) ||
        existing.materials.length !==
          (allActivities.find((x) => x.id === activityId) ? existing.materials.length : 0);
      if (edited && !confirm("Remove this activity? Your edits to it will be lost.")) {
        return;
      }
      setActs((prev) => prev.filter((a) => a.activityId !== activityId));
      try {
        const res = await fetch(`/api/events/${eventId}/activities/${existing.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
        router.refresh();
      } catch {
        toast.error("Failed to remove activity");
        setActs((prev) => [...prev, existing]);
      }
      return;
    }

    // Add
    setPendingId(activityId);
    try {
      const res = await fetch(`/api/events/${eventId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActs((prev) => [...prev, data]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add activity");
    } finally {
      setPendingId(null);
    }
  }

  function patchLocalMaterial(eaId: string, matId: string, patch: Partial<{ checked: boolean }>) {
    setActs((prev) =>
      prev.map((a) =>
        a.id === eaId
          ? {
              ...a,
              materials: a.materials.map((m) =>
                m.id === matId ? { ...m, ...patch } : m
              ),
            }
          : a
      )
    );
  }

  async function toggleMaterial(eaId: string, matId: string, checked: boolean) {
    patchLocalMaterial(eaId, matId, { checked });
    try {
      const res = await fetch(`/api/materials/${matId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked }),
      });
      if (!res.ok) throw new Error();
    } catch {
      patchLocalMaterial(eaId, matId, { checked: !checked });
      toast.error("Failed to update");
    }
  }

  async function addMaterial(eaId: string, name: string) {
    try {
      const res = await fetch(`/api/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventActivityId: eaId, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActs((prev) =>
        prev.map((a) =>
          a.id === eaId ? { ...a, materials: [...a.materials, data] } : a
        )
      );
    } catch {
      toast.error("Failed to add item");
    }
  }

  async function deleteMaterial(eaId: string, matId: string) {
    const snapshot = acts;
    setActs((prev) =>
      prev.map((a) =>
        a.id === eaId
          ? { ...a, materials: a.materials.filter((m) => m.id !== matId) }
          : a
      )
    );
    try {
      const res = await fetch(`/api/materials/${matId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setActs(snapshot);
      toast.error("Failed to delete item");
    }
  }

  async function saveNotes(eaId: string, notes: string) {
    setActs((prev) => prev.map((a) => (a.id === eaId ? { ...a, notes } : a)));
    try {
      await fetch(`/api/events/${eventId}/activities/${eaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } catch {
      toast.error("Failed to save notes");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm text-ink-secondary">
          Tap an activity to add it. Materials auto-fill and stay fully editable.
        </p>
        <ActivityPalette
          activities={allActivities}
          activeIds={activeIds}
          pendingId={pendingId}
          onToggle={toggleActivity}
        />
      </div>

      <ActivityChecklist
        activities={acts}
        onToggleMaterial={toggleMaterial}
        onAddMaterial={addMaterial}
        onDeleteMaterial={deleteMaterial}
        onRemoveActivity={toggleActivity}
        onNotes={saveNotes}
      />

      <div className="border-t pt-5">
        <ArtistRegister
          eventId={eventId}
          eventName={eventName}
          initial={lineup}
          allArtists={allArtists}
          submittedKeys={submittedKeys}
        />
      </div>
    </div>
  );
}
