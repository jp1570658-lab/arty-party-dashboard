"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ListChecks } from "lucide-react";
import { toast } from "sonner";
import { ActivityPalette } from "./ActivityPalette";
import { ActivityCard } from "./ActivityCard";
import type { ActivityRef, EventActivityItem } from "./activity-types";

export function ActivitiesSection({
  eventId,
  allActivities,
  initial,
}: {
  eventId: string;
  allActivities: ActivityRef[];
  initial: EventActivityItem[];
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

  const allMaterials = acts.flatMap((a) =>
    a.materials.map((m) => ({ ...m, activity: a.activity.name }))
  );
  const doneCount = allMaterials.filter((m) => m.checked).length;

  return (
    <div className="space-y-5">
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

      <AnimatePresence>
        {acts.length > 0 && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {acts.map((ea) => (
              <ActivityCard
                key={ea.id}
                ea={ea}
                onRemove={() => toggleActivity(ea.activityId)}
                onToggleMaterial={(matId, checked) =>
                  toggleMaterial(ea.id, matId, checked)
                }
                onAddMaterial={(name) => addMaterial(ea.id, name)}
                onDeleteMaterial={(matId) => deleteMaterial(ea.id, matId)}
                onNotes={(notes) => saveNotes(ea.id, notes)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {allMaterials.length > 0 && (
        <div className="rounded-xl border bg-surface-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-brand-purple" />
              <span className="section-label mb-0">Materials summary</span>
            </div>
            <span className="text-xs text-ink-muted">
              {doneCount}/{allMaterials.length} packed
            </span>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            {allMaterials.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-sm">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    m.checked ? "bg-success" : "bg-line-strong"
                  }`}
                />
                <span className={m.checked ? "text-ink-muted line-through" : "text-ink-primary"}>
                  {m.name}
                </span>
                <span className="ml-auto text-xs text-ink-muted">{m.activity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
