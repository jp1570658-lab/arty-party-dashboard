"use client";

import { useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaterialItem } from "./activity-types";

export function MaterialsList({
  materials,
  onToggle,
  onAdd,
  onDelete,
}: {
  materials: MaterialItem[];
  onToggle: (matId: string, checked: boolean) => void;
  onAdd: (name: string) => void;
  onDelete: (matId: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  const done = materials.filter((m) => m.checked).length;

  function submit() {
    const v = value.trim();
    if (v) {
      onAdd(v);
      setValue("");
      setAdding(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="section-label mb-0">Materials & checklist</span>
        <span className="text-xs text-ink-muted">
          {done}/{materials.length} done
        </span>
      </div>

      <ul className="space-y-1">
        {materials.map((m) => (
          <li
            key={m.id}
            className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-surface-2"
          >
            <button
              onClick={() => onToggle(m.id, !m.checked)}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                m.checked
                  ? "border-brand-purple bg-brand-purple text-white"
                  : "border-line-strong"
              )}
              aria-label={m.checked ? "Uncheck" : "Check"}
            >
              {m.checked && <Check className="h-3.5 w-3.5" />}
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
              onClick={() => onDelete(m.id)}
              className="opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
              aria-label="Delete material"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Add an item…"
            className="input py-1.5"
          />
          <button onClick={submit} className="btn-primary px-2 py-1.5" aria-label="Add">
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAdding(false)}
            className="btn-ghost px-2 py-1.5"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-dark"
        >
          <Plus className="h-4 w-4" />
          Add item
        </button>
      )}
    </div>
  );
}
