"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check, Printer, FileDown, Trash2, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui/primitives";
import { formatTime } from "@/lib/utils";
import { zonedTimeKey, zonedToIso } from "@/lib/timezone";

/** ISO → "HH:MM" (Brussels) for the inline time inputs. */
const toTimeInput = zonedTimeKey;

/** Borderless input that looks like text until you focus it. Commits on blur so
 *  editing an AI-drafted row is a click-and-type, not a modal. */
function EditableCell({
  value,
  placeholder,
  className,
  type = "text",
  onCommit,
}: {
  value: string;
  placeholder?: string;
  className?: string;
  type?: string;
  onCommit: (value: string) => void;
}) {
  return (
    <>
      <input
        type={type}
        defaultValue={value}
        key={value}
        placeholder={placeholder}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v !== value) onCommit(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.currentTarget.value = value;
            e.currentTarget.blur();
          }
        }}
        className={`rounded border-transparent bg-transparent px-1 py-0.5 text-sm placeholder:text-ink-muted hover:bg-surface-2 focus:bg-surface-2 focus:outline-none focus:ring-1 focus:ring-purple-500 print:hidden ${className ?? ""}`}
      />
      <span className={`hidden print:inline ${className ?? ""}`}>{value || placeholder}</span>
    </>
  );
}

interface RosItem {
  id: string;
  time: string;
  duration: number | null;
  item: string;
  location: string | null;
  owner: string | null;
  notes: string | null;
  order: number;
}

export function RunOfShow({
  eventId,
  eventDateOnly,
  initial,
}: {
  eventId: string;
  eventDateOnly: string;
  initial: RosItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<RosItem[]>(initial);
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    time: "",
    duration: "",
    item: "",
    owner: "",
    location: "",
    notes: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function add() {
    if (!form.time || !form.item) {
      toast.error("Time and item are required");
      return;
    }
    try {
      const res = await fetch(`/api/events/${eventId}/run-of-show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: zonedToIso(eventDateOnly, form.time),
          duration: form.duration ? Number(form.duration) : null,
          item: form.item,
          owner: form.owner,
          location: form.location,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((p) => [...p, data]);
      setForm({ time: "", duration: "", item: "", owner: "", location: "", notes: "" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  async function remove(id: string) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/events/${eventId}/run-of-show/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setItems(prev);
      toast.error("Failed to delete");
    }
  }

  /** Inline row edit — every AI-drafted row stays fully adjustable. */
  async function patch(id: string, patchBody: Partial<RosItem>) {
    const prev = items;
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patchBody } : i)));
    try {
      const res = await fetch(`/api/events/${eventId}/run-of-show/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
      toast.error("Failed to save");
    }
  }

  async function generate() {
    const hasItems = items.length > 0;
    if (
      hasItems &&
      !confirm(
        "Replace the current run of show with a fresh AI draft? Your existing rows will be removed."
      )
    ) {
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`/api/events/${eventId}/run-of-show/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replace: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to draft");
      setItems(data.items);
      toast.success(
        `Drafted ${data.generated} rows — review and adjust anything that's off`
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to draft");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="text-sm text-ink-secondary">
          The master timeline for event day — hand this to your crew.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={generate} loading={generating}>
            <Sparkles className="h-4 w-4" />
            {items.length > 0 ? "Redraft with AI" : "Draft with AI"}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <a
            href={`/api/events/${eventId}/run-of-show/pdf`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Time</th>
              <th className="px-3 py-2 font-semibold">Dur</th>
              <th className="px-3 py-2 font-semibold">Item</th>
              <th className="px-3 py-2 font-semibold">Owner</th>
              <th className="px-3 py-2 font-semibold">Location</th>
              <th className="px-3 py-2 font-semibold print:hidden"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-muted">
                  No items yet. Draft one with AI, or add the first cue below.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-t align-top">
                <td className="whitespace-nowrap px-3 py-2">
                  <input
                    type="time"
                    defaultValue={toTimeInput(it.time)}
                    onBlur={(e) => {
                      if (!e.target.value) return;
                      const iso = zonedToIso(eventDateOnly, e.target.value);
                      if (iso !== it.time) patch(it.id, { time: iso });
                    }}
                    className="w-[92px] rounded border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold tabular-nums hover:bg-surface-2 focus:bg-surface-2 focus:outline-none focus:ring-1 focus:ring-purple-500 print:hidden"
                  />
                  <span className="hidden font-semibold tabular-nums print:inline">
                    {formatTime(it.time)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <EditableCell
                    value={it.duration != null ? String(it.duration) : ""}
                    placeholder="—"
                    type="number"
                    className="w-14"
                    onCommit={(v) =>
                      patch(it.id, { duration: v ? Number(v) : null })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={it.item}
                    placeholder="Item / cue"
                    className="w-full font-medium text-ink-primary"
                    onCommit={(v) => v && patch(it.id, { item: v })}
                  />
                  <EditableCell
                    value={it.notes ?? ""}
                    placeholder="Add a note…"
                    className="w-full text-xs text-ink-muted"
                    onCommit={(v) => patch(it.id, { notes: v || null })}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={it.owner ?? ""}
                    placeholder="—"
                    className="w-24 text-ink-secondary"
                    onCommit={(v) => patch(it.id, { owner: v || null })}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={it.location ?? ""}
                    placeholder="—"
                    className="w-24 text-ink-secondary"
                    onCommit={(v) => patch(it.id, { location: v || null })}
                  />
                </td>
                <td className="px-3 py-2 print:hidden">
                  <button
                    onClick={() => remove(it.id)}
                    className="text-ink-muted hover:text-danger"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="space-y-2 rounded-xl border bg-surface-1 p-3 print:hidden">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="label flex items-center gap-1"><Clock className="h-3 w-3" />Time</span>
              <Input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="label">Duration (min)</span>
              <Input type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
            </label>
            <label className="space-y-1 col-span-2 sm:col-span-1">
              <span className="label">Owner</span>
              <Input value={form.owner} onChange={(e) => set("owner", e.target.value)} />
            </label>
          </div>
          <Input placeholder="Item / cue (e.g. Poetry set begins)" value={form.item} onChange={(e) => set("item", e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Location" value={form.location} onChange={(e) => set("location", e.target.value)} />
            <Input placeholder="Notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={add}>
              <Check className="h-4 w-4" />
              Add cue
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple-dark print:hidden"
        >
          <Plus className="h-4 w-4" />
          Add cue
        </button>
      )}
    </div>
  );
}
