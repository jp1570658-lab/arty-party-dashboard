"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageSquare, Plus, Trash2, X } from "lucide-react";
import { activityIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import type { EventActivityItem } from "./activity-types";

/**
 * One flat, scannable checklist grouped by activity — replaces the old
 * two-column activity-card grid plus its duplicate "materials summary".
 * Same data model, just far less to read.
 */
export function ActivityChecklist({
  activities,
  onToggleMaterial,
  onAddMaterial,
  onDeleteMaterial,
  onRemoveActivity,
  onNotes,
}: {
  activities: EventActivityItem[];
  onToggleMaterial: (eaId: string, matId: string, checked: boolean) => void;
  onAddMaterial: (eaId: string, name: string) => void;
  onDeleteMaterial: (eaId: string, matId: string) => void;
  onRemoveActivity: (activityId: string) => void;
  onNotes: (eaId: string, notes: string) => void;
}) {
  const [outstandingOnly, setOutstandingOnly] = useState(false);

  const all = activities.flatMap((a) => a.materials);
  const done = all.filter((m) => m.checked).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;

  if (activities.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Single progress header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[160px]">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="section-label mb-0">Checklist</span>
            <span className="text-xs text-ink-secondary">
              <span className="font-medium text-ink-primary">{done}</span> of {all.length} done
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full rounded-full bg-brand-purple"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <button
          onClick={() => setOutstandingOnly((v) => !v)}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            outstandingOnly
              ? "bg-brand-purple text-white"
              : "bg-surface-2 text-ink-secondary hover:text-ink-primary"
          )}
        >
          {outstandingOnly ? "Showing outstanding" : "Show outstanding only"}
        </button>
      </div>

      <div className="divide-y rounded-xl border bg-surface-0">
        {activities.map((ea) => (
          <ActivityGroup
            key={ea.id}
            ea={ea}
            outstandingOnly={outstandingOnly}
            onToggleMaterial={(matId, checked) => onToggleMaterial(ea.id, matId, checked)}
            onAddMaterial={(name) => onAddMaterial(ea.id, name)}
            onDeleteMaterial={(matId) => onDeleteMaterial(ea.id, matId)}
            onRemove={() => onRemoveActivity(ea.activityId)}
            onNotes={(notes) => onNotes(ea.id, notes)}
          />
        ))}
      </div>
    </div>
  );
}

function ActivityGroup({
  ea,
  outstandingOnly,
  onToggleMaterial,
  onAddMaterial,
  onDeleteMaterial,
  onRemove,
  onNotes,
}: {
  ea: EventActivityItem;
  outstandingOnly: boolean;
  onToggleMaterial: (matId: string, checked: boolean) => void;
  onAddMaterial: (name: string) => void;
  onDeleteMaterial: (matId: string) => void;
  onRemove: () => void;
  onNotes: (notes: string) => void;
}) {
  const Icon = activityIcon(ea.activity.icon);
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const [showNotes, setShowNotes] = useState(!!ea.notes);
  const [notes, setNotes] = useState(ea.notes ?? "");

  const visible = outstandingOnly ? ea.materials.filter((m) => !m.checked) : ea.materials;
  const done = ea.materials.filter((m) => m.checked).length;
  const complete = ea.materials.length > 0 && done === ea.materials.length;

  function submitNew() {
    const v = value.trim();
    if (!v) return;
    onAddMaterial(v);
    setValue("");
    setAdding(false);
  }

  if (outstandingOnly && visible.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <div className="group/head flex items-center gap-2.5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: ea.activity.color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-ink-primary">{ea.activity.name}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            complete
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-surface-2 text-ink-secondary"
          )}
        >
          {done}/{ea.materials.length}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className={cn(
              "rounded-md p-1.5 transition-colors hover:text-brand-purple",
              notes ? "text-brand-purple" : "text-ink-muted"
            )}
            title="Notes for this activity"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="rounded-md p-1.5 text-ink-muted opacity-0 transition-opacity hover:text-danger group-hover/head:opacity-100"
            aria-label={`Remove ${ea.activity.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {ea.activity.defaultTeam && (
        <p className="ml-[38px] mt-0.5 text-xs text-ink-muted">{ea.activity.defaultTeam}</p>
      )}

      <ul className="ml-[38px] mt-2 space-y-0.5">
        {visible.map((m) => (
          <li key={m.id} className="group flex items-center gap-2.5 rounded-md py-0.5">
            <button
              onClick={() => onToggleMaterial(m.id, !m.checked)}
              className={cn(
                "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors",
                m.checked
                  ? "border-brand-purple bg-brand-purple text-white"
                  : "border-line-strong hover:border-brand-purple"
              )}
              aria-label={m.checked ? `Uncheck ${m.name}` : `Check ${m.name}`}
            >
              {m.checked && <Check className="h-3 w-3" />}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                m.checked ? "text-ink-muted line-through" : "text-ink-primary"
              )}
            >
              {m.name}
            </span>
            <button
              onClick={() => onDeleteMaterial(m.id)}
              className="text-ink-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
              aria-label={`Delete ${m.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="ml-[38px] mt-1.5">
        {adding ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNew();
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Add an item…"
              className="input py-1"
            />
            <button onClick={submitNew} className="btn-primary px-2 py-1" aria-label="Add">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setAdding(false)}
              className="btn-ghost px-2 py-1"
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-brand-purple"
          >
            <Plus className="h-3.5 w-3.5" />
            Add item
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {showNotes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (ea.notes ?? "") && onNotes(notes)}
              placeholder="Anything specific for this activity…"
              className="input ml-[38px] mt-2 min-h-[52px] w-[calc(100%-38px)] resize-y text-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
