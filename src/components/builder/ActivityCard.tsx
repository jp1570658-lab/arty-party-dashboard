"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Trash2 } from "lucide-react";
import { MaterialsList } from "./MaterialsList";
import { activityIcon } from "@/lib/icon-map";
import type { EventActivityItem } from "./activity-types";

export function ActivityCard({
  ea,
  onRemove,
  onToggleMaterial,
  onAddMaterial,
  onDeleteMaterial,
  onNotes,
}: {
  ea: EventActivityItem;
  onRemove: () => void;
  onToggleMaterial: (matId: string, checked: boolean) => void;
  onAddMaterial: (name: string) => void;
  onDeleteMaterial: (matId: string) => void;
  onNotes: (notes: string) => void;
}) {
  const Icon = activityIcon(ea.activity.icon);
  const [notes, setNotes] = useState(ea.notes ?? "");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-xl border bg-surface-1 p-4"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: ea.activity.color }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div>
            <div className="font-semibold text-ink-primary">{ea.activity.name}</div>
            {ea.activity.defaultTeam && (
              <div className="flex items-center gap-1 text-xs text-ink-secondary">
                <Users className="h-3 w-3" />
                {ea.activity.defaultTeam}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="btn-ghost px-2 py-1.5 text-ink-muted hover:text-danger"
          aria-label="Remove activity"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <MaterialsList
        materials={ea.materials}
        onToggle={onToggleMaterial}
        onAdd={onAddMaterial}
        onDelete={onDeleteMaterial}
      />

      <div className="mt-3">
        <span className="section-label">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (ea.notes ?? "") && onNotes(notes)}
          placeholder="Anything specific for this activity…"
          className="input min-h-[60px] resize-y"
        />
      </div>
    </motion.div>
  );
}
